import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Category, MultiplayerRoom, MultiplayerPlayer } from "./types";

console.log("[ARKUMEN] STARTING SERVER SCRIPT...");

const PORT = 3000;

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Arkumen" });
  });

  // Rooms state
  const rooms: Map<string, MultiplayerRoom> = new Map();
  const playerSockets: Map<string, WebSocket> = new Map();

  // Gemini API setup
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  const QUESTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        minItems: 4,
        maxItems: 4
      },
      correctAnswer: { type: Type.INTEGER, description: "Index 0 to 3" },
      explanation: { type: Type.STRING }
    },
    required: ["text", "options", "correctAnswer", "explanation"]
  };

  async function fetchServerQuestions(count: number, category: Category): Promise<Question[]> {
    if (!ai) throw new Error("AI not initialized");
    
    const prompt = `Generate ${count} unique, high-quality trivia questions for a game called Arkumen.
    Category: ${category}.
    Questions must be accurate, engaging, and have 4 clear options.
    Output the response as a JSON array of question objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: QUESTION_SCHEMA
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const rawQuestions = JSON.parse(text);
    
    return rawQuestions.map((q: any, index: number) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      difficulty: 1 + index,
      category: category
    }));
  }

  function broadcastToRoom(roomId: string, message: any) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    room.players.forEach(player => {
      const socket = playerSockets.get(player.id);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }

  wss.on("connection", (ws) => {
    let currentPlayerId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on("message", async (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "join": {
          const { user, roomId } = message;
          currentPlayerId = user.id;
          currentRoomId = roomId;
          playerSockets.set(user.id, ws);

          let room = rooms.get(roomId);
          if (!room) {
            room = {
              id: roomId,
              players: [],
              status: 'waiting',
              questions: [],
              currentQuestionIndex: 0,
              timer: 0,
              category: 'General Knowledge'
            };
            rooms.set(roomId, room);
            
            // Pre-fetch questions in background
            fetchServerQuestions(10, room.category).then(qs => {
              if (room) room.questions = qs;
            }).catch(e => console.error("Pre-fetch error:", e));
          }

          if (room.status !== 'waiting') {
            ws.send(JSON.stringify({ type: "error", message: "Game already in progress" }));
            return;
          }

          const existingPlayer = room.players.find(p => p.id === user.id);
          if (!existingPlayer) {
            room.players.push({
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              score: 0,
              isReady: false
            });
          }

          broadcastToRoom(roomId, { type: "room_update", room });
          break;
        }

        case "ready": {
          if (!currentRoomId || !currentPlayerId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const player = room.players.find(p => p.id === currentPlayerId);
          if (player) {
            player.isReady = true;
          }

          const allReady = room.players.length >= 2 && room.players.every(p => p.isReady);
          if (allReady) {
            room.status = 'starting';
            broadcastToRoom(currentRoomId, { type: "room_update", room });
            
            try {
              // Use pre-fetched questions if available, otherwise fetch
              if (room.questions.length === 0) {
                room.questions = await fetchServerQuestions(10, room.category);
              }
              
              room.status = 'playing';
              room.currentQuestionIndex = 0;
              room.timer = 15;
              broadcastToRoom(currentRoomId, { type: "game_start", room });
              
              // Start game loop
              startGameLoop(currentRoomId);
            } catch (err) {
              console.error("Failed to start game:", err);
              broadcastToRoom(currentRoomId, { type: "error", message: "Failed to fetch questions" });
            }
          } else {
            broadcastToRoom(currentRoomId, { type: "room_update", room });
          }
          break;
        }

        case "submit_answer": {
          if (!currentRoomId || !currentPlayerId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.status !== 'playing') return;

          const { answerIndex } = message;
          const player = room.players.find(p => p.id === currentPlayerId);
          if (!player) return;

          const currentQ = room.questions[room.currentQuestionIndex];
          const isCorrect = answerIndex === currentQ.correctAnswer;
          
          if (isCorrect) {
            player.score += 10 + room.timer; // Speed bonus
          }
          player.lastAnswerCorrect = isCorrect;

          // Check if all players answered
          // (In a real app, we'd track who answered. For now, just update score)
          broadcastToRoom(currentRoomId, { type: "room_update", room });
          break;
        }
      }
    });

    ws.on("close", () => {
      if (currentPlayerId && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== currentPlayerId);
          if (room.players.length === 0) {
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(currentRoomId, { type: "room_update", room });
          }
        }
        playerSockets.delete(currentPlayerId);
      }
    });
  });

  function startGameLoop(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const interval = setInterval(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.status !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (currentRoom.timer > 0) {
        currentRoom.timer--;
        broadcastToRoom(roomId, { type: "timer_update", timer: currentRoom.timer });
      } else {
        // Time's up for current question
        if (currentRoom.currentQuestionIndex < currentRoom.questions.length - 1) {
          currentRoom.currentQuestionIndex++;
          currentRoom.timer = 15;
          broadcastToRoom(roomId, { type: "next_question", room: currentRoom });
        } else {
          currentRoom.status = 'finished';
          broadcastToRoom(roomId, { type: "game_over", room: currentRoom });
          clearInterval(interval);
        }
      }
    }, 1000);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  // Request logging
  app.use((req, res, next) => {
    if (!req.url.startsWith('/@') && !req.url.includes('.tsx')) {
      console.log(`[ARKUMEN] ${req.method} ${req.url}`);
    }
    next();
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ARKUMEN SERVER ACTIVE ON PORT ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
});

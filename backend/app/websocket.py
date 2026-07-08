import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("fleetpulse.websocket")

class ConnectionManager:
    def __init__(self):
        # Store active websocket connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Broadcast JSON message to all connected clients."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Error sending data to websocket client: {e}")
                dead_connections.append(connection)
                
        # Clean up dead connections
        for connection in dead_connections:
            self.disconnect(connection)

# Global manager instance
manager = ConnectionManager()

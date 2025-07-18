"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Check, Edit } from "lucide-react";
import { Room, getRooms, getCurrentRoomId, setCurrentRoomId, createRoom, deleteRoom, updateRoom, deleteRoomChatHistory } from "@/lib/storage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoomDialog({ open, onOpenChange }: Props) {
  const [rooms, setRoomsState] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomIdState] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const getDefaultRoomName = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day} 新しいルーム`;
  };

  const [newRoomName, setNewRoomName] = useState(getDefaultRoomName);

  useEffect(() => {
    if (open) {
      setRoomsState(getRooms());
      setCurrentRoomIdState(getCurrentRoomId());
    }
  }, [open]);

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim());
      setRoomsState(getRooms());
      setNewRoomName(getDefaultRoomName());
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm("このルームを削除しますか？\n\n※このルームのメッセージとチャット履歴も削除されます。")) {
      // ルームのチャット履歴を削除
      deleteRoomChatHistory(roomId);
      // ルームを削除
      deleteRoom(roomId);
      setRoomsState(getRooms());
      setCurrentRoomIdState(getCurrentRoomId());
    }
  };

  const handleSwitchRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setCurrentRoomIdState(roomId);
  };

  const handleStartEdit = (room: Room) => {
    setEditingRoomId(room.id);
    setEditingName(room.name);
  };

  const handleSaveEdit = () => {
    if (editingRoomId && editingName.trim()) {
      updateRoom(editingRoomId, { name: editingName.trim() });
      setRoomsState(getRooms());
      setEditingRoomId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditingName("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !currentRoomId) {
      alert("ルームを選択してください。");
      return;
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full p-6 rounded-lg shadow-lg">
        <DialogHeader className="mb-4">
          <DialogTitle>ルーム管理</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 新しいルーム作成 */}
          <div className="flex items-center gap-2">
            <Input placeholder="新しいルーム名" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
            <Button size="sm" onClick={handleCreateRoom} disabled={!newRoomName.trim()} className="cursor-pointer">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Separator />
          {rooms.length === 0 && <p className="text-sm text-red-800 dark:text-yellow-200">ルームを作成してください。</p>}
          {!currentRoomId && <p className="text-sm text-red-800 dark:text-yellow-200">下のリストからルームを選択してください。</p>}

          {/* ルーム一覧 */}
          <div className="space-y-2 max-h-60 overflow-y-auto text-sm">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between px-2 py-2 rounded-md">
                <div className="flex items-center gap-2 w-full">
                  {editingRoomId === room.id ? (
                    <div className="flex-1 flex items-center gap-2 w-full">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="cursor-pointer">
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium p-1">{room.name}</span>
                    </div>
                  )}
                </div>

                {editingRoomId !== room.id && (
                  <div className="flex items-center gap-2">
                    {room.id === currentRoomId && <Check className="w-4 h-4 text-primary" />}
                    {room.id !== currentRoomId && (
                      <Button size="sm" variant="outline" onClick={() => handleSwitchRoom(room.id)} className="cursor-pointer">
                        選択
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleStartEdit(room)} className="cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {room.id !== currentRoomId && (
                      <Button size="sm" variant="outline" onClick={() => handleDeleteRoom(room.id)} className="cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

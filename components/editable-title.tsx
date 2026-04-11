"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EditableTitleProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  tag?: "h1" | "h2" | "h3" | "span";
}

export function EditableTitle({
  value,
  onSave,
  className = "",
  inputClassName = "",
  maxLength = 128,
  tag: Tag = "h1",
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === value) {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      setEditValue(value);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            setEditValue(value);
            setIsEditing(false);
          }
        }}
        maxLength={maxLength}
        disabled={saving}
        className={`bg-white/10 border border-white/30 rounded-lg px-3 py-1 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-all ${inputClassName}`}
      />
    );
  }

  return (
    <Tag
      onClick={() => setIsEditing(true)}
      title="Clique para editar"
      className={`cursor-pointer hover:bg-white/10 rounded-lg px-3 py-1 -mx-3 -my-1 transition-colors duration-200 ${className}`}
    >
      {value}
    </Tag>
  );
}

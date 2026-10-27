"use client";

import { useMemo, useState } from "react";
import { createReplyAction, updateReplyAction } from "./actions";

export type Reply = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  is_post_owner: boolean;
  author_name: string;
  author_title: string;
  edited_at: string | null;
  is_mine: boolean;
};

export default function ReplyThread({
  postId,
  replies,
  canReply,
}: {
  postId: string;
  replies: Reply[];
  canReply: boolean;
}) {
  const [items, setItems] = useState<Reply[]>(replies);
  const [activeId, setActiveId] = useState<string | null>(null); // "root" or a reply id
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Reply[]>();
    for (const r of items) {
      const list = map.get(r.parent_id) ?? [];
      list.push(r);
      map.set(r.parent_id, list);
    }
    return map;
  }, [items]);

  async function send(parentId: string | null) {
    setSending(true);
    setNotice("");
    const result = await createReplyAction({ postId, parentId, body: text });
    setSending(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setItems((prev) => [...prev, result.reply]);
    setText("");
    setActiveId(null);
  }

  async function saveEdit(replyId: string) {
    setSending(true);
    setNotice("");
    const result = await updateReplyAction({ replyId, body: editText });
    setSending(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setItems((prev) => prev.map((r) => (r.id === replyId ? result.reply : r)));
    setEditingId(null);
  }

  const replyForm = (parentId: string | null) => (
    <div className="reply-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder="Write a thoughtful reply…"
        aria-label="Write a reply"
      />
      <div className="reply-form-actions">
        <button
          type="button"
          className="button button-small"
          disabled={sending || text.trim().length < 2}
          onClick={() => void send(parentId)}
        >
          {sending ? "Sending…" : "Send reply"}
        </button>
        <button type="button" className="text-link" onClick={() => setActiveId(null)}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderNode = (reply: Reply) => (
    <div className="reply" key={reply.id}>
      <div className="reply-head">
        <b>{reply.author_name}</b>
        <span className={reply.is_post_owner ? "sample-pill" : "reply-role"}>
          {reply.author_title}
        </span>
        <small>{new Date(reply.created_at).toLocaleDateString()}</small>
        {reply.edited_at && <small className="reply-edited">(edited)</small>}
      </div>

      {editingId === reply.id ? (
        <div className="reply-form">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={4000}
            aria-label="Edit your reply"
          />
          <div className="reply-form-actions">
            <button
              type="button"
              className="button button-small"
              disabled={sending || editText.trim().length < 2}
              onClick={() => void saveEdit(reply.id)}
            >
              {sending ? "Saving…" : "Save"}
            </button>
            <button type="button" className="text-link" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>{reply.body}</p>
          <div className="reply-actions">
            {canReply && (
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setActiveId(activeId === reply.id ? null : reply.id);
                  setNotice("");
                }}
              >
                Reply
              </button>
            )}
            {reply.is_mine && (
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setEditingId(reply.id);
                  setEditText(reply.body);
                  setNotice("");
                }}
              >
                Edit
              </button>
            )}
          </div>
        </>
      )}

      {activeId === reply.id && replyForm(reply.id)}
      <div className="reply-children">
        {(childrenOf.get(reply.id) ?? []).map(renderNode)}
      </div>
    </div>
  );

  return (
    <div className="reply-thread">
      {(childrenOf.get(null) ?? []).map(renderNode)}

      {canReply ? (
        activeId === "root" ? (
          replyForm(null)
        ) : (
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setActiveId("root");
              setNotice("");
            }}
          >
            Write a reply
          </button>
        )
      ) : (
        <p className="reply-note">
          Only the author of this reflection and verified mentors can reply.
        </p>
      )}
      {notice && (
        <p className="form-notice" role="alert">
          {notice}
        </p>
      )}
    </div>
  );
}
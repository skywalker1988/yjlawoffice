/**
 * ImageDialog — 그림 삽입 대화상자
 * URL 또는 파일 업로드로 이미지를 에디터에 삽입한다.
 */
import { useState, useRef } from "react";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function ImageDialog({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const fileInputRef = useRef(null);

  const insertFromUrl = () => {
    if (url) {
      editor?.chain().focus().setImage({ src: url, alt: alt || undefined }).run();
      onClose();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor?.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <DialogShell title="그림 삽입" onClose={onClose} width={440}>
      <div className="word-dialog-body">
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">URL에서 삽입:</label>
          <input className="word-dialog-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">대체 텍스트:</label>
          <input className="word-dialog-input" value={alt} onChange={e => setAlt(e.target.value)} placeholder="이미지 설명" />
        </div>
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginBottom: 12 }}>
          <label className="word-dialog-label">파일에서 업로드:</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload}
            style={{ fontSize: 11, marginTop: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>
          이미지를 에디터에 직접 드래그 앤 드롭할 수도 있습니다.
        </div>
      </div>
      <DialogFooter onOk={insertFromUrl} onCancel={onClose} okLabel="삽입" disableOk={!url} />
    </DialogShell>
  );
}

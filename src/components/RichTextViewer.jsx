import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, EditIcon, ExpandIcon } from './Icons';

const RichTextViewer = ({ content, mode, onEdit, onCopy, onExpand }) => {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleEdit = () => {
    setIsEditorMode(!isEditorMode);
    if (isEditorMode && onEdit) {
      onEdit(editedContent);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    if (onCopy) onCopy();
  };

  const handleExpand = () => {
    if (onExpand) onExpand(editedContent);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditorMode) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editedContent, isEditorMode]);

  return (
    <div className="rich-text-viewer">
      <div className="rich-text-header">
        <div className="mode-indicator">
          <span className="mode-badge">{mode}</span>
        </div>
        <div className="text-actions">
          <button
            className="text-action-btn"
            onClick={handleEdit}
            title={isEditorMode ? "Save changes" : "Edit response"}
          >
            <EditIcon size={14} />
          </button>
          <button
            className="text-action-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <CopyIcon size={14} />
          </button>
          <button
            className="text-action-btn"
            onClick={handleExpand}
            title="Expand in full screen"
          >
            <ExpandIcon size={14} />
          </button>
        </div>
      </div>

      <div className="rich-text-content">
        {isEditorMode ? (
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="rich-text-editor"
            placeholder="Edit the AI response..."
            spellCheck={true}
          />
        ) : (
          <div className="rich-text-display">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom components for better styling
                h1: ({children}) => <h1 className="text-heading-1">{children}</h1>,
                h2: ({children}) => <h2 className="text-heading-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-heading-3">{children}</h3>,
                p: ({children}) => <p className="text-paragraph">{children}</p>,
                ul: ({children}) => <ul className="text-list">{children}</ul>,
                ol: ({children}) => <ol className="text-list-ordered">{children}</ol>,
                li: ({children}) => <li className="text-list-item">{children}</li>,
                blockquote: ({children}) => <blockquote className="text-quote">{children}</blockquote>,
                code: ({inline, children}) => 
                  inline ? 
                    <code className="text-code-inline">{children}</code> : 
                    <code className="text-code-block">{children}</code>,
                pre: ({children}) => <pre className="text-pre">{children}</pre>,
                strong: ({children}) => <strong className="text-bold">{children}</strong>,
                em: ({children}) => <em className="text-italic">{children}</em>,
                a: ({href, children}) => <a href={href} className="text-link" target="_blank" rel="noopener noreferrer">{children}</a>,
                table: ({children}) => <table className="text-table">{children}</table>,
                th: ({children}) => <th className="text-table-header">{children}</th>,
                td: ({children}) => <td className="text-table-cell">{children}</td>,
              }}
            >
              {editedContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="rich-text-footer">
        <div className="text-stats">
          <span className="char-count">{editedContent.length} characters</span>
          <span className="word-count">{editedContent.split(/\s+/).filter(word => word.length > 0).length} words</span>
        </div>
        {isEditorMode && (
          <div className="editor-hints">
            <span className="hint">Supports Markdown formatting</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextViewer;
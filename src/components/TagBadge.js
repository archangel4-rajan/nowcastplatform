import React from 'react';

function TagBadge({ tag, selected, onClick }) {
  return (
    <span
      className={`tag-badge ${selected ? 'tag-badge-selected' : ''} ${onClick ? 'tag-badge-clickable' : ''}`}
      onClick={onClick}
    >
      {tag}
    </span>
  );
}

export default TagBadge;


import React from 'react';
import { Tag } from '../types';
import { DraggableProvided } from 'react-beautiful-dnd';

interface TagChipProps {
  tag: Tag;
  categoryColor: string;
  categoryTextColor: string;
  onRemove?: (tagId: string) => void;
  isDraggable?: boolean;
  provided?: DraggableProvided;
  onClick?: () => void; // For tags in selector
  isSelectedInSelector?: boolean; // For tags in selector
  isDragging?: boolean; // For visual feedback when dragging
  onMoveLeft?: (tagId: string) => void;
  onMoveRight?: (tagId: string) => void;
  indexInSelectedList?: number;
  totalSelectedTagsCount?: number;
  onToggleLock?: (tagId: string) => void; // New prop for locking
}

const DragHandleIcon: React.FC<{ sizeClassName?: string, additionalClassName?: string }> = ({ sizeClassName = 'w-4 h-4', additionalClassName = 'opacity-70' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${sizeClassName} ${additionalClassName}`}>
    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75V5.5h-1.5V3.75A.75.75 0 0110 3zm-2.5 3.5A.75.75 0 018.25 6H10V4.5H8.25a.75.75 0 00-.75.75v1.25zm5 0A.75.75 0 0011.75 6H10V4.5h1.75a.75.75 0 01.75.75v1.25zm-5 3A.75.75 0 018.25 9H10V7.5H8.25a.75.75 0 00-.75.75v1.25zm5 0A.75.75 0 0011.75 9H10V7.5h1.75a.75.75 0 01.75.75v1.25zm-5 3A.75.75 0 018.25 12H10v-1.5H8.25a.75.75 0 00-.75.75v1.25zm5 0A.75.75 0 0011.75 12H10v-1.5h1.75a.75.75 0 01.75.75v1.25zm-2.5 3.5a.75.75 0 01-.75-.75V14.5h1.5v1.25a.75.75 0 01-.75.75z" clipRule="evenodd" />
  </svg>
);


const CheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

// const LockClosedIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
//     <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
//   </svg>
// );

const LockOpenIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h4.5zM15 9V5.5a3 3 0 00-3-3V1a4.5 4.5 0 00-3 8.81V9H5a.5.5 0 00-.5.5V17a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-7.5a.5.5 0 00-.5-.5H15z" clipRule="evenodd" />
  </svg>
);


const TagChip: React.FC<TagChipProps> = ({
  tag,
  categoryColor,
  categoryTextColor,
  onRemove,
  isDraggable,
  provided,
  onClick,
  isSelectedInSelector,
  isDragging,
  onMoveLeft,
  onMoveRight,
  indexInSelectedList,
  totalSelectedTagsCount,
  onToggleLock,
}) => {
  const chipClasses = `selected-tag-chip ${categoryColor} ${categoryTextColor} ${tag.isLocked ? 'border-2 border-yellow-400' : ''}`;

  if (isDraggable && provided) { // Chip for selected list (draggable)
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={`${chipClasses} relative group transition-all duration-150 ease-in-out ${isDragging ? 'shadow-xl scale-105 z-10' : ''} ${tag.isLocked ? 'ring-2 ring-yellow-500 ring-offset-1 ring-offset-gray-800' : ''}`}
        style={{
          ...provided.draggableProps.style, // Preserve react-beautiful-dnd styles
        }}
        title={`${tag.name} (${tag.japaneseName})${tag.isLocked ? ' [ロック中]' : ''}`}
      >
        {isDraggable && onToggleLock && (
           <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(tag.id); }}
            className={`p-0.5 rounded-full hover:bg-black/20 transition-opacity mr-1 flex items-center justify-center ${tag.isLocked ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
            aria-label={tag.isLocked ? `「${tag.japaneseName}」をアンロック` : `「${tag.japaneseName}」をロック`}
            style={{ minWidth: '1.25rem', minHeight: '1.25rem' }} // Ensure button has a clickable area
          >
            {tag.isLocked ? <span role="img" aria-label="ロック中" style={{fontSize: '0.8rem'}}>🔒️</span> : <LockOpenIcon />}
          </button>
        )}

        {isDraggable && (
          <span
            {...provided.dragHandleProps}
            className="p-0.5 cursor-grab"
            aria-label="ドラッグして並び替え"
          >
            <DragHandleIcon sizeClassName="w-5 h-5" />
          </span>
        )}

        {isDraggable && onMoveLeft && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveLeft(tag.id); }}
            disabled={indexInSelectedList === 0}
            className="p-1 rounded-full text-gray-400 hover:text-gray-100 hover:bg-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={`「${tag.japaneseName}」を左へ移動`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </button>
        )}
        
        <div className="flex flex-col items-start leading-tight max-w-[80px] truncate"> {/* Reduced max-width */}
          <span className="text-xs font-semibold">{tag.name}</span>
          <span className="text-[10px] opacity-80">{tag.japaneseName}</span>
        </div>

        {isDraggable && onMoveRight && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveRight(tag.id); }}
            disabled={indexInSelectedList != null && totalSelectedTagsCount != null && indexInSelectedList >= totalSelectedTagsCount - 1}
            className="p-1 rounded-full text-gray-400 hover:text-gray-100 hover:bg-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={`「${tag.japaneseName}」を右へ移動`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
          </button>
        )}

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!tag.isLocked) { // Prevent removal if locked
                onRemove(tag.id);
              }
            }}
            disabled={tag.isLocked} // Disable button if tag is locked
            className={`p-0.5 rounded-full opacity-70 hover:opacity-100 hover:bg-black/20 transition-opacity ${tag.isLocked ? 'cursor-not-allowed opacity-30' : ''}`}
            aria-label={`「${tag.japaneseName}」を削除`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Chip for tag selector (clickable, not draggable)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tag-selector-chip text-left relative ${isSelectedInSelector ? `selected ${categoryColor} ${categoryTextColor} border-transparent shadow-md` : `bg-gray-800 hover:bg-gray-700 text-gray-300`}`}
      aria-pressed={isSelectedInSelector}
      title={`${tag.name} (${tag.japaneseName})`}
    >
      <div className="flex flex-col items-start leading-tight">
        <span className="text-sm font-medium">{tag.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-300">{tag.japaneseName}</span>
      </div>
      {isSelectedInSelector && (
        <CheckIcon className={`absolute top-1 right-1 ${categoryTextColor === 'text-black' ? 'text-gray-700' : categoryTextColor}`} />
      )}
    </button>
  );
};

export default TagChip;

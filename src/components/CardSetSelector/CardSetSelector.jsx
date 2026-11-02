import styles from './CardSetSelector.module.css';
import { useCardSetEditor } from '@/lib/hooks/useCardSetEditor';
import { CARD_PRESETS } from '@/lib/constants';
import {
  MAX_LABEL_LENGTH,
  MAX_VALUE_LENGTH,
  isTextLabel,
} from '@/lib/card-validation';
function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
export function CardSetSelector({
  initialCardSet,
  onCardSetChange,
  hideHeader = false,
}) {
  const {
    selectedPreset,
    currentCards,
    firstCardInputRef,
    lastCardInputRef,
    draggedIndex,
    dragOverIndex,
    hasDuplicateValue,
    handlePresetChange,
    handleResetPreset,
    handleAddCard,
    handleRemoveCard,
    handleCardChange,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleInputBlur,
  } = useCardSetEditor(initialCardSet, onCardSetChange);
  const presetOptions = ['fibonacci', 'tshirt', 'weeks', 'custom'];
  return (
    <div className={styles.cardSetSelector}>
      {!hideHeader && (
        <>
          <div className={styles.cardSetSelectorDivider}></div>
          <h3 className={styles.cardSetSelectorTitle}>Card Set</h3>
        </>
      )}

      <div className={styles.cardSetPresets}>
        {presetOptions.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`${styles.cardSetPresetButton} ${selectedPreset === preset ? styles.selected : ''}`}
            onClick={() => handlePresetChange(preset)}
          >
            {CARD_PRESETS[preset].name}
          </button>
        ))}
      </div>

      <div className={styles.cardSetEditor}>
        <div className={styles.cardSetEditorHeader}>
          <button
            type="button"
            className={styles.cardSetEditorReset}
            onClick={handleResetPreset}
            title="Reset to default"
          >
            <ResetIcon />
          </button>
        </div>
        <div className={styles.cardSetEditorCards}>
          {currentCards.map((card, index) => {
            const isDuplicate = hasDuplicateValue(card);
            const isDragging = draggedIndex === index;
            const isDragOver =
              dragOverIndex === index && draggedIndex !== index;
            return (
              <div
                key={index}
                className={`${styles.cardSetEditorCard} ${isDuplicate ? styles.duplicateWarning : ''} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                title={
                  isDuplicate
                    ? 'Duplicate vote value'
                    : card.description || 'Drag to reorder'
                }
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <button
                  type="button"
                  className={styles.cardSetEditorCardRemove}
                  onClick={() => handleRemoveCard(index)}
                  aria-label="Remove card"
                  title="Remove card"
                >
                  ✕
                </button>
                <div className={styles.cardSetEditorCardContent}>
                  <input
                    ref={
                      index === 0
                        ? firstCardInputRef
                        : index === currentCards.length - 1
                          ? lastCardInputRef
                          : null
                    }
                    type="text"
                    className={`${styles.cardSetEditorCardLabel} ${isTextLabel(card.label) ? styles.cardSetEditorCardLabelText : ''}`}
                    placeholder=" "
                    value={card.label}
                    onChange={(e) =>
                      handleCardChange(index, 'label', e.target.value)
                    }
                    onBlur={() => handleInputBlur(index, 'label')}
                    maxLength={MAX_LABEL_LENGTH}
                    title="Card label (emoji, text, etc.)"
                  />
                  <input
                    type="text"
                    className={styles.cardSetEditorCardValue}
                    placeholder="value"
                    value={card.value}
                    onChange={(e) =>
                      handleCardChange(index, 'value', e.target.value)
                    }
                    onBlur={() => handleInputBlur(index, 'value')}
                    maxLength={MAX_VALUE_LENGTH}
                    title="Vote value"
                  />
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className={styles.cardSetEditorAddCard}
            onClick={handleAddCard}
            title="Add new card"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { CARD_PRESETS, DEFAULT_CARD_PRESET } from '@/lib/constants';
import {
  getValidCards,
  getVoteValue,
  getDuplicateValues,
} from '@/lib/card-validation';
const initializePresetCards = (preset, initialCardSet) => {
  if (initialCardSet?.preset === preset) {
    return initialCardSet.cards.map((card) => ({ ...card }));
  }
  if (preset === 'custom') {
    return [{ value: '', label: '', description: '' }];
  }
  return CARD_PRESETS[preset].cards.map((card) => ({
    value: card.value,
    label: card.label,
    description: card.description,
  }));
};
export function useCardSetEditor(initialCardSet, onCardSetChange) {
  const [selectedPreset, setSelectedPreset] = useState(
    initialCardSet?.preset || DEFAULT_CARD_PRESET
  );
  const [presetCards, setPresetCards] = useState(() => ({
    tshirt: initializePresetCards('tshirt', initialCardSet),
    fibonacci: initializePresetCards('fibonacci', initialCardSet),
    weeks: initializePresetCards('weeks', initialCardSet),
    custom: initializePresetCards('custom', initialCardSet),
  }));
  const firstCardInputRef = useRef(null);
  const lastCardInputRef = useRef(null);
  const focusTargetRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const currentCards = presetCards[selectedPreset];
  const duplicateValues = useMemo(
    () => getDuplicateValues(currentCards),
    [currentCards]
  );
  const hasDuplicateValue = (card) => {
    const value = getVoteValue(card);
    return value !== '' && duplicateValues.has(value);
  };
  const handlePresetChange = (preset) => {
    focusTargetRef.current = preset === 'custom' ? 'first' : null;
    setSelectedPreset(preset);
    const cards = presetCards[preset];
    onCardSetChange({
      preset,
      cards: getValidCards(cards),
    });
  };
  const handleResetPreset = () => {
    focusTargetRef.current = selectedPreset === 'custom' ? 'first' : null;
    const defaultCards =
      selectedPreset === 'custom'
        ? [{ value: '', label: '', description: '' }]
        : CARD_PRESETS[selectedPreset].cards.map((card) => ({
            value: card.value,
            label: card.label,
            description: card.description,
          }));
    setPresetCards((prev) => ({ ...prev, [selectedPreset]: defaultCards }));
    onCardSetChange({
      preset: selectedPreset,
      cards: getValidCards(defaultCards),
    });
  };
  const handleAddCard = () => {
    focusTargetRef.current = 'last';
    const newCards = [
      ...currentCards,
      { value: '', label: '', description: '' },
    ];
    setPresetCards((prev) => ({ ...prev, [selectedPreset]: newCards }));
    onCardSetChange({
      preset: selectedPreset,
      cards: getValidCards(newCards),
    });
  };
  useEffect(() => {
    if (focusTargetRef.current === 'first' && firstCardInputRef.current) {
      firstCardInputRef.current.focus();
    } else if (focusTargetRef.current === 'last' && lastCardInputRef.current) {
      lastCardInputRef.current.focus();
    }
    focusTargetRef.current = null;
  }, [currentCards.length, selectedPreset]);
  const handleRemoveCard = (index) => {
    const newCards = currentCards.filter((_, i) => i !== index);
    setPresetCards((prev) => ({ ...prev, [selectedPreset]: newCards }));
    onCardSetChange({
      preset: selectedPreset,
      cards: getValidCards(newCards),
    });
  };
  const handleCardChange = (index, field, value) => {
    const newCards = [...currentCards];
    newCards[index] = { ...newCards[index], [field]: value };
    if (field === 'value' || field === 'label') {
      const card = newCards[index];
      newCards[index].description = card.value || card.label;
    }
    setPresetCards((prev) => ({ ...prev, [selectedPreset]: newCards }));
    onCardSetChange({
      preset: selectedPreset,
      cards: getValidCards(newCards),
    });
  };
  const handleDragStart = (e, index) => {
    document.activeElement?.blur();
    // Create a clean drag image without focus styles
    const dragElement = e.currentTarget.cloneNode(true);
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-9999px';
    dragElement.style.left = '-9999px';
    // Remove focus styling from inputs in the clone
    const inputs = dragElement.querySelectorAll('input');
    inputs.forEach((input) => {
      input.style.background = 'transparent';
      input.style.borderColor = 'transparent';
    });
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(
      dragElement,
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    // Clean up the clone after drag image is captured
    setTimeout(() => dragElement.remove(), 0);
    setDraggedIndex(index);
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newCards = [...currentCards];
      const [draggedCard] = newCards.splice(draggedIndex, 1);
      newCards.splice(dragOverIndex, 0, draggedCard);
      setPresetCards((prev) => ({ ...prev, [selectedPreset]: newCards }));
      onCardSetChange({
        preset: selectedPreset,
        cards: getValidCards(newCards),
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleInputBlur = (index, field) => {
    const card = currentCards[index];
    const trimmedValue = card[field].trim();
    if (trimmedValue !== card[field]) {
      handleCardChange(index, field, trimmedValue);
    }
  };
  return {
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
  };
}

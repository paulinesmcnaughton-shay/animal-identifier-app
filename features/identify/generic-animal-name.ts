const GENERIC_NAMES =
  /^(dog|cat|mammal|pet|animal|canine|feline|puppy|kitten|domestic dog|domestic cat|dog breed|cat breed|vertebrate)$/i

export function isGenericAnimalName(name: string): boolean {
  const trimmed = name.trim()
  if (GENERIC_NAMES.test(trimmed)) return true
  if (/^domestic /i.test(trimmed) && trimmed.split(/\s+/).length <= 2) return true
  return false
}

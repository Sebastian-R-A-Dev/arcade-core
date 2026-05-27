/** Compara la respuesta del jugador con la guardada en la pregunta. */
export function isAnswerCorrect(storedAnswer: string, submittedAnswer: string): boolean {
  return storedAnswer.trim() === submittedAnswer.trim();
}

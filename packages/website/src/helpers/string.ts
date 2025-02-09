export const isEmoji = (str: string) =>
  str.match(/^\p{Extended_Pictographic}$/u);

export const isCircledLetter = (str: string) => str.match(/^[\u24B6-\u24E9]$/);

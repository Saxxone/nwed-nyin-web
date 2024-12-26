export interface Word {
  word: string;
  alt_spelling: string;
  pronunciation: string;
  part_of_speech: string[];
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface Definition {
  meaning: string;
  examples: string[];
  links: Link[];
}

export interface Link {
  target: string;
  text: string;
}

export interface Word {
  word: string;
  pronunciation: string;
  partOfSpeech: string[];
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

import type { Word } from "../types/dictionary/word";

export const words: Word[] = [
  {
    word: "example",
    pronunciation: "/ɪɡˈzæmpəl/",
    alt_spelling: "sample",
    definitions: [
      {
        meaning: "A representative instance.",
        examples: ["This is an example of good writing."],
        part_of_speech: "noun",
        links: [
          {
            target: "instance",
            text: "instance",
          },
        ],
      },
      {
        meaning: "To illustrate by example.",
        part_of_speech: "verb",
        examples: ["He exemplified good behavior."],
        links: [],
      },
    ],
    synonyms: ["sample", "illustration"],
  },
];

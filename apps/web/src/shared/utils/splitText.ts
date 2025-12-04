/**
 * SplitText風の文字分割ユーティリティ
 * GSAP SplitText (Club GreenSock) を使わずに実装
 */

export interface SplitResult {
  chars: HTMLSpanElement[];
  words: HTMLSpanElement[];
  revert: () => void;
}

export function splitText(
  element: HTMLElement,
  type: "chars" | "words" | "both" = "chars"
): SplitResult {
  const originalHTML = element.innerHTML;
  const text = element.textContent || "";

  const chars: HTMLSpanElement[] = [];
  const words: HTMLSpanElement[] = [];

  element.innerHTML = "";
  element.setAttribute("aria-label", text);

  if (type === "words" || type === "both") {
    const wordArray = text.split(/\s+/);
    wordArray.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word inline-block";
      wordSpan.style.display = "inline-block";

      if (type === "both") {
        // 文字単位でも分割
        word.split("").forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.className = "char inline-block";
          charSpan.style.display = "inline-block";
          charSpan.textContent = char;
          charSpan.setAttribute("aria-hidden", "true");
          charSpan.setAttribute("data-char", char);
          wordSpan.appendChild(charSpan);
          chars.push(charSpan);
        });
      } else {
        wordSpan.textContent = word;
      }

      wordSpan.setAttribute("aria-hidden", "true");
      words.push(wordSpan);
      element.appendChild(wordSpan);

      // 単語間のスペース
      if (wordIndex < wordArray.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }
    });
  } else {
    // 文字単位のみ
    text.split("").forEach((char) => {
      if (char === " ") {
        element.appendChild(document.createTextNode(" "));
      } else {
        const charSpan = document.createElement("span");
        charSpan.className = "char inline-block";
        charSpan.style.display = "inline-block";
        charSpan.textContent = char;
        charSpan.setAttribute("aria-hidden", "true");
        charSpan.setAttribute("data-char", char);
        chars.push(charSpan);
        element.appendChild(charSpan);
      }
    });
  }

  return {
    chars,
    words,
    revert: () => {
      element.innerHTML = originalHTML;
      element.removeAttribute("aria-label");
    },
  };
}

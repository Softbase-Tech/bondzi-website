import Image from "next/image";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import type { Question, QuestionOption } from "@/lib/api/types";

interface Props {
  question: Question;
  /** Answered state — powers the correct/incorrect chrome on review pages. */
  selectedOptionId?: string | null;
  correctOptionId?: string | null;
  /** When true, options render as disabled radio-like tiles (review mode). */
  readOnly?: boolean;
  /** When true, wraps the whole thing in a subtle border card. Result-review pages want this; the runner does its own framing. */
  framed?: boolean;
  onSelect?: (optionId: string) => void;
  /** Preview / kicker text like "Question 3 of 20". */
  kicker?: string;
}

/**
 * Read-only question presenter. Handles:
 *   - Optional shared stimulus block (renders once per grouped run).
 *   - Question body: prefers pre-rendered `bodyHtml` (KaTeX baked in on
 *     the backend), falls back to plain `body` text wrapped in `<p>`.
 *   - Optional inline image (Next Image, lazy, responsive sizes).
 *   - Options: radio-style tiles, hover / focus / selected / correct /
 *     incorrect visual states, 44px+ tap targets, keyboard navigable.
 *
 * The parent controls "runner" vs "review" behaviour via `readOnly` and
 * the `correctOptionId` prop — a single component covers taking the
 * exam AND reviewing wrong answers on the result screen.
 */
export function QuestionRenderer({
  question,
  selectedOptionId,
  correctOptionId,
  readOnly = false,
  framed = false,
  onSelect,
  kicker,
}: Props) {
  const content = (
    <>
      {question.stimulus ? (
        <div className="mb-5 p-4 sm:p-5 rounded-xl border border-rule bg-yellow-soft/40">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute mb-2">
            Stimulus
          </div>
          <div
            className="prose-bondzi max-w-none text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(question.stimulus.text),
            }}
          />
          {question.stimulus.imageUrl ? (
            <div className="mt-3 relative w-full aspect-video">
              <Image
                src={question.stimulus.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-contain rounded-lg"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {kicker ? (
        <div className="text-[12px] font-semibold uppercase tracking-widest text-ink-mute mb-2">
          {kicker}
        </div>
      ) : null}

      <div
        className="prose-bondzi max-w-none text-[17px] sm:text-[18px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(question.text) }}
      />

      {question.imageUrl ? (
        <div className="mt-4 relative w-full aspect-video">
          <Image
            src={question.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-contain rounded-lg border border-rule"
          />
        </div>
      ) : null}

      {question.options.length > 0 ? (
        <div className="mt-6 space-y-2.5">
          {question.options.map((opt) => (
            <OptionTile
              key={opt.id}
              option={opt}
              selected={selectedOptionId === opt.id}
              isCorrect={
                correctOptionId != null
                  ? opt.id === correctOptionId
                  : undefined
              }
              isWrongPick={
                correctOptionId != null &&
                selectedOptionId === opt.id &&
                selectedOptionId !== correctOptionId
              }
              readOnly={readOnly}
              onSelect={() => onSelect?.(opt.id)}
            />
          ))}
        </div>
      ) : null}
    </>
  );

  return framed ? (
    <div className="p-5 sm:p-6 rounded-2xl border border-rule bg-paper">
      {content}
    </div>
  ) : (
    content
  );
}

// ---- option tile -----------------------------------------------------------

function OptionTile({
  option,
  selected,
  isCorrect,
  isWrongPick,
  readOnly,
  onSelect,
}: {
  option: QuestionOption;
  selected: boolean;
  isCorrect?: boolean;
  isWrongPick?: boolean;
  readOnly: boolean;
  onSelect: () => void;
}) {
  // Colour resolution priority:
  //   1. isWrongPick (student's wrong choice on a review page) — red
  //   2. isCorrect (highlighted answer on a review page) — green
  //   3. selected (mid-session pick) — orange
  //   4. default — paper
  const stateClass = isWrongPick
    ? "border-red-500 bg-red-50"
    : isCorrect === true
      ? "border-emerald-500 bg-emerald-50"
      : selected
        ? "border-orange bg-yellow-soft/60"
        : "border-rule-strong bg-paper hover:border-ink-soft";

  const commonProps = {
    className: cn(
      "w-full text-left rounded-xl border-2 transition-colors motion-reduce:transition-none",
      "flex items-start gap-3 p-3.5 sm:p-4",
      "min-h-11",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      stateClass,
      readOnly && "cursor-default",
    ),
    "aria-pressed": selected,
  } as const;

  const label = (
    <>
      <span
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-[13px] font-semibold",
          isWrongPick
            ? "bg-red-500 text-white"
            : isCorrect === true
              ? "bg-emerald-500 text-white"
              : selected
                ? "bg-orange text-paper"
                : "bg-yellow-soft text-ink",
        )}
      >
        {option.label}
      </span>
      <div className="flex-1 min-w-0 pt-1">
        <div
          className="prose-bondzi max-w-none text-[15px] leading-snug"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(option.text) }}
        />
        {option.imageUrl ? (
          <div className="mt-2 relative w-full max-w-xs aspect-video">
            <Image
              src={option.imageUrl}
              alt=""
              fill
              sizes="320px"
              className="object-contain rounded-lg"
            />
          </div>
        ) : null}
      </div>
    </>
  );

  if (readOnly) {
    return <div {...commonProps}>{label}</div>;
  }

  return (
    <button type="button" onClick={onSelect} {...commonProps}>
      {label}
    </button>
  );
}

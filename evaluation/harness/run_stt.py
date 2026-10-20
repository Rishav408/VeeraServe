"""Compute speech-to-text word error rate (M-5).

Usage, from the repository root:

    python -m evaluation.harness.run_stt
    python -m evaluation.harness.run_stt --limit 5

The audio set is synthesized with Windows SAPI as a clean baseline; human-recorded
clips remain the protocol target. Clips live under `evaluation/datasets/audio/`.
"""

import argparse
import json
import re
from statistics import median
from typing import Any

from evaluation.harness.common import DATASETS_DIR, ratio, write_result

AUDIO_DIR = DATASETS_DIR / "audio"
TARGETS = {"wer": 0.15}

UNITS = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
}
TENS = {
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90,
}


def tokens(text: str) -> list[str]:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    raw = cleaned.split()
    normalized: list[str] = []
    index = 0
    while index < len(raw):
        word = raw[index]
        if word in TENS:
            value = TENS[word]
            if index + 1 < len(raw) and raw[index + 1] in UNITS and UNITS[raw[index + 1]] < 10:
                value += UNITS[raw[index + 1]]
                index += 1
            normalized.append(str(value))
        elif word in UNITS:
            normalized.append(str(UNITS[word]))
        else:
            normalized.append(word)
        index += 1
    return normalized


def word_errors(reference: str, hypothesis: str) -> tuple[int, int]:
    ref = tokens(reference)
    hyp = tokens(hypothesis)
    previous = list(range(len(hyp) + 1))
    for row, ref_word in enumerate(ref, start=1):
        current = [row]
        for column, hyp_word in enumerate(hyp, start=1):
            cost = 0 if ref_word == hyp_word else 1
            current.append(
                min(
                    previous[column] + 1,
                    current[column - 1] + 1,
                    previous[column - 1] + cost,
                )
            )
        previous = current
    return previous[-1], len(ref)


def run(*, limit: int | None = None) -> dict[str, Any]:
    from app.core.config import get_settings
    from app.services.transcription import TranscriptionError, transcribe_audio

    manifest = json.loads((AUDIO_DIR / "manifest.json").read_text(encoding="utf-8"))
    items = manifest["items"]
    if limit is not None:
        items = items[:limit]

    missing = [item["file"] for item in items if not (AUDIO_DIR / item["file"]).exists()]
    if missing:
        raise SystemExit(
            "Missing audio clips: "
            + ", ".join(missing)
            + "\nGenerate them from the manifest (Windows SAPI) before running M-5."
        )

    records: list[dict[str, Any]] = []
    for item in items:
        audio = (AUDIO_DIR / item["file"]).read_bytes()
        try:
            transcript = transcribe_audio(audio, suffix=".wav")
        except TranscriptionError as exc:
            raise SystemExit(f"STT unavailable: {exc}") from exc
        errors, words = word_errors(item["transcript"], transcript)
        records.append(
            {
                "id": item["id"],
                "reference": item["transcript"],
                "hypothesis": transcript,
                "errors": errors,
                "words": words,
                "wer": ratio(errors, words),
            }
        )

    total_errors = sum(record["errors"] for record in records)
    total_words = sum(record["words"] for record in records)
    settings = get_settings()
    return {
        "suite": "stt",
        "dataset_version": manifest.get("version", "unknown"),
        "source": manifest.get("source"),
        "model": {
            "size": settings.stt_model_size,
            "device": settings.stt_device,
            "compute_type": settings.stt_compute_type,
        },
        "items": len(records),
        "records": records,
        "metrics": {
            "wer": ratio(total_errors, total_words),
            "mean_wer": ratio(sum(record["wer"] for record in records), len(records)),
            "median_wer": round(median(record["wer"] for record in records), 4),
        },
        "targets": TARGETS,
    }


def _print_summary(payload: dict[str, Any]) -> None:
    metrics = payload["metrics"]
    print(
        f"STT items={payload['items']} corpus-WER={metrics['wer']:.3f} "
        f"mean={metrics['mean_wer']:.3f} median={metrics['median_wer']:.3f}"
    )
    for record in payload["records"]:
        if record["wer"] > 0:
            print(f"  {record['id']} wer={record['wer']:.3f}: {record['hypothesis']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", default="stt")
    parser.add_argument("--strict", action="store_true", help="exit 1 when the target is missed")
    args = parser.parse_args(argv)

    payload = run(limit=args.limit)
    _print_summary(payload)
    path = write_result(args.out, payload)
    print(f"Wrote {path}")
    missed = payload["metrics"]["wer"] > TARGETS["wer"]
    return 1 if args.strict and missed else 0


if __name__ == "__main__":
    raise SystemExit(main())

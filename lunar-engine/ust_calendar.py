
"""
COSMIC CALENDAR — UNIVERSAL STANDARD TIME (UST)
LUNA CHRONOS integration
Version: 0.1.1

Architecture:
- Option 2: UST + International Lunar Time.
- Option 3: Long-term research programme.
- 13 fixed, equal calendar phases per cycle.
- Custom epoch: 2000-01-06 09:16:00 UTC.

IMPORTANT SCIENTIFIC STATUS:
This is an independent proposed calendar.
The epoch is custom, not an asserted astronomical New Moon.
This version calculates provisionally from UTC datetime labels.
It does not implement TCL or UTC-to-TCL conversion.
It does not account for leap seconds.
"""

from datetime import datetime, timezone, timedelta
from math import floor
from typing import Any


# ============================================================
# 1. CALENDAR DEFINITION
# ============================================================

CALENDAR_NAME = "COSMIC CALENDAR — UNIVERSAL STANDARD TIME"
CALENDAR_VERSION = "0.1.1"

EPOCH_UTC = datetime(
    2000, 1, 6, 9, 16, 0,
    tzinfo=timezone.utc
)

# Original proposed UST cycle parameter.
# Retained provisionally pending final provenance review.
SYNODIC_MONTH_DAYS = 29.5305879710734

PHASES_PER_CYCLE = 13
SECONDS_PER_DAY = 86400

CYCLE_DURATION_SECONDS = (
    SYNODIC_MONTH_DAYS * SECONDS_PER_DAY
)

PHASE_DURATION_SECONDS = (
    CYCLE_DURATION_SECONDS / PHASES_PER_CYCLE
)

REFERENCE_TIME_SCALE = "UTC"
TIME_CONVERSION_STATUS = "PROVISIONAL_UTC_BASED"
SCIENTIFIC_STATUS = "INDEPENDENT_PROPOSED_CALENDAR"


# ============================================================
# 2. INPUT VALIDATION
# ============================================================

def parse_utc_datetime(value: str) -> datetime:
    """
    Parse an ISO 8601 datetime.
    A timezone must be explicitly supplied.
    """

    if not isinstance(value, str) or not value.strip():
        raise ValueError(
            "date_time must be a non-empty ISO 8601 string."
        )

    normalized = value.strip()

    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(
            "Invalid ISO 8601 date_time. "
            "Example: 2026-11-06T12:00:00Z"
        ) from exc

    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(
            "A timezone is required. Use Z or an explicit UTC offset."
        )

    return parsed.astimezone(timezone.utc)


# ============================================================
# 3. CORE UST CALCULATION
# ============================================================

def calculate_ust(date_time: str) -> dict[str, Any]:
    """
    Calculate the provisional UST calendar position.

    Input and epoch are compared as UTC datetime labels.
    This is not a physical elapsed-time realization of TCL.
    """

    input_utc = parse_utc_datetime(date_time)

    elapsed_seconds = (
        input_utc - EPOCH_UTC
    ).total_seconds()

    # Mathematical floor supports dates before the epoch.
    cycle_number = floor(
        elapsed_seconds / CYCLE_DURATION_SECONDS
    )

    cycle_elapsed_seconds = (
        elapsed_seconds
        - cycle_number * CYCLE_DURATION_SECONDS
    )

    phase_position = (
        cycle_elapsed_seconds / PHASE_DURATION_SECONDS
    )

    phase_index_zero_based = floor(phase_position)

    phase_number = phase_index_zero_based + 1

    phase_progress = (
        phase_position - phase_index_zero_based
    ) * 100.0

    phase_elapsed_seconds = (
        cycle_elapsed_seconds
        - phase_index_zero_based * PHASE_DURATION_SECONDS
    )

    # Protect output against floating-point rounding.
    phase_progress = max(
        0.0,
        min(phase_progress, 100.0)
    )

    return {
        "calendar_name": CALENDAR_NAME,
        "calendar_version": CALENDAR_VERSION,

        "epoch_identifier": "UST_CUSTOM_EPOCH_2000",
        "epoch_utc": EPOCH_UTC.isoformat().replace("+00:00", "Z"),
        "input_utc": input_utc.isoformat().replace("+00:00", "Z"),

        "reference_time_scale": REFERENCE_TIME_SCALE,
        "time_conversion_status": TIME_CONVERSION_STATUS,
        "time_conversion_model": (
            "UTC datetime-label subtraction; "
            "no leap-second or UTC-to-TCL transformation"
        ),
        "time_conversion_uncertainty": None,

        "elapsed_seconds": elapsed_seconds,

        "cycle_number": cycle_number,
        "phase_number": phase_number,
        "phases_per_cycle": PHASES_PER_CYCLE,

        "phase_progress_percent": phase_progress,
        "phase_elapsed_seconds": phase_elapsed_seconds,
        "cycle_elapsed_seconds": cycle_elapsed_seconds,

        "cycle_duration_days": SYNODIC_MONTH_DAYS,
        "cycle_duration_seconds": CYCLE_DURATION_SECONDS,

        "phase_duration_days": (
            SYNODIC_MONTH_DAYS / PHASES_PER_CYCLE
        ),
        "phase_duration_seconds": PHASE_DURATION_SECONDS,

        "scientific_status": SCIENTIFIC_STATUS,

        # No TCL value is calculated in this version.
        "tcl_value": None,
        "tcl_conversion_performed": False,

        # Actual astronomical lunar phase requires a separate
        # ephemeris calculation.
        "actual_lunar_phase": None
    }


# ============================================================
# 4. VALIDATION TESTS
# ============================================================

def run_validation_tests() -> dict[str, Any]:
    """
    Test:
    1. Custom epoch.
    2. Phase 2 boundary.
    3. Next cycle boundary.
    4. Date before epoch.
    5. Explicit timezone requirement.
    """

    # TEST 1 — Custom epoch
    epoch_result = calculate_ust(
        "2000-01-06T09:16:00Z"
    )

    assert epoch_result["cycle_number"] == 0
    assert epoch_result["phase_number"] == 1
    assert abs(
        epoch_result["phase_progress_percent"]
    ) < 1e-9

    # TEST 2 — Immediately after phase 2 boundary.
    phase_2_datetime = (
        EPOCH_UTC
        + timedelta(
            seconds=PHASE_DURATION_SECONDS,
            microseconds=1
        )
    )

    phase_2_result = calculate_ust(
        phase_2_datetime.isoformat()
    )

    assert phase_2_result["phase_number"] == 2

    # TEST 3 — Immediately after next cycle boundary.
    next_cycle_datetime = (
        EPOCH_UTC
        + timedelta(
            seconds=CYCLE_DURATION_SECONDS,
            microseconds=1
        )
    )

    next_cycle_result = calculate_ust(
        next_cycle_datetime.isoformat()
    )

    assert next_cycle_result["cycle_number"] == 1
    assert next_cycle_result["phase_number"] == 1

    # TEST 4 — Date before custom epoch.
    before_epoch_result = calculate_ust(
        "2000-01-05T09:16:00Z"
    )

    assert before_epoch_result["cycle_number"] == -1
    assert 1 <= before_epoch_result["phase_number"] <= 13

    # TEST 5 — Reject datetime without timezone.
    timezone_rejection_passed = False

    try:
        calculate_ust("2026-11-06T12:00:00")
    except ValueError:
        timezone_rejection_passed = True

    assert timezone_rejection_passed

    return {
        "status": "PASS",
        "tests": {
            "custom_epoch": "PASS",
            "phase_2_boundary": "PASS",
            "next_cycle_boundary": "PASS",
            "date_before_epoch": "PASS",
            "timezone_validation": "PASS"
        },
        "phase_duration_seconds": PHASE_DURATION_SECONDS,
        "phase_duration_hours": (
            PHASE_DURATION_SECONDS / 3600
        )
    }


# ============================================================
# 5. DIRECT EXECUTION
# ============================================================

if __name__ == "__main__":

    print("COSMIC CALENDAR — UST")
    print("=====================")

    print("\nCalendar parameters:")

    print(
        f"Cycle duration: "
        f"{CYCLE_DURATION_SECONDS:.6f} seconds"
    )

    print(
        f"Number of phases: {PHASES_PER_CYCLE}"
    )

    print(
        f"Phase duration: "
        f"{PHASE_DURATION_SECONDS:.6f} seconds"
    )

    print(
        f"Phase duration: "
        f"{PHASE_DURATION_SECONDS / 3600:.8f} hours"
    )

    print("\nValidation results:")
    print(run_validation_tests())

    print("\nExample calculation:")

    example = calculate_ust(
        "2026-11-06T12:00:00Z"
    )

    for key, value in example.items():
        print(f"{key}: {value}")

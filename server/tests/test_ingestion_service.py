import pytest

from services.ingestion_service import parse_csv_rows


def test_valid_csv_parses_all_rows():
    csv_content = (
        "title,description,customer_name,address,service_type,priority\n"
        "Leak under sink,Slow drip,Jane Doe,123 Main St,plumbing,high\n"
        "AC not cooling,Unit blowing warm air,John Roe,456 Oak Ave,hvac,medium\n"
    ).encode("utf-8")

    rows, errors = parse_csv_rows(csv_content)

    assert len(rows) == 2
    assert len(errors) == 0
    assert rows[0].title == "Leak under sink"
    assert rows[0].priority == "high"
    assert rows[1].service_type == "hvac"


def test_missing_required_title_column_raises():
    csv_content = "description,customer_name\nsomething,someone\n".encode("utf-8")
    with pytest.raises(ValueError):
        parse_csv_rows(csv_content)


def test_row_with_empty_title_is_reported_as_error_not_raised():
    csv_content = "title,service_type\n,plumbing\nValid title,plumbing\n".encode("utf-8")
    rows, errors = parse_csv_rows(csv_content)

    assert len(rows) == 1
    assert rows[0].title == "Valid title"
    assert len(errors) == 1
    assert errors[0].row_number == 1


def test_row_number_accounts_for_header_and_is_1_indexed():
    # csv.DictReader skips fully-blank lines, so row 2 here is the first bad row.
    csv_content = "title\nGood Row\n,extra-value-with-no-header\n".encode("utf-8")
    rows, errors = parse_csv_rows(csv_content)
    assert len(rows) == 1
    assert len(errors) == 1
    assert errors[0].row_number == 2


def test_priority_is_normalized_to_lowercase():
    csv_content = "title,priority\nUrgent leak,HIGH\n".encode("utf-8")
    rows, errors = parse_csv_rows(csv_content)
    assert not errors
    assert rows[0].priority == "high"


def test_invalid_priority_reported_as_row_error():
    csv_content = "title,priority\nSomething,not-a-real-priority\n".encode("utf-8")
    rows, errors = parse_csv_rows(csv_content)
    assert len(rows) == 0
    assert len(errors) == 1
    assert "priority" in errors[0].errors[0]

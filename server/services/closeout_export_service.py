"""Printable closeout package export rendering."""

from html import escape

from models.closeout_package import WorkOrderCloseoutPackage


def build_closeout_html(package: WorkOrderCloseoutPackage) -> str:
    work_order = package.work_order
    title = f"TechSync Ops Closeout Package - WO #{work_order.id}"

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #050816;
      --panel: #0f172a;
      --card: #020617;
      --line: #1f2937;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --ok: #a3e635;
      --warn: #fbbf24;
      --danger: #fb7185;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, Arial, sans-serif;
      line-height: 1.5;
    }}
    main {{ max-width: 960px; margin: 0 auto; padding: 32px 20px; }}
    header {{ border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 20px; }}
    h1 {{ margin: 0; font-size: 28px; }}
    h2 {{ color: var(--accent); font-size: 18px; margin: 24px 0 10px; }}
    .meta {{ color: var(--muted); margin-top: 6px; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }}
    .tile, .item {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }}
    .label {{ color: var(--muted); font-size: 12px; text-transform: uppercase; font-weight: 700; }}
    .value {{ font-weight: 700; margin-top: 4px; }}
    .ok {{ color: var(--ok); }}
    .warn {{ color: var(--warn); }}
    .danger {{ color: var(--danger); }}
    a {{ color: var(--accent); word-break: break-all; }}
    @media print {{
      body {{ background: #fff; color: #111827; }}
      .tile, .item {{ border-color: #d1d5db; background: #fff; }}
      h2, a {{ color: #0369a1; }}
      .meta, .label {{ color: #4b5563; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <h1>{escape(title)}</h1>
      <div class="meta">{escape(work_order.title)}</div>
    </header>

    <section>
      <h2>Summary</h2>
      <div class="grid">
        {summary_tile("Status", work_order.status)}
        {summary_tile("Priority", work_order.priority)}
        {summary_tile("Proof", package.proof_status)}
        {summary_tile("Client Approval", work_order.client_approval_status)}
        {summary_tile("Completed", format_value(work_order.completed_at))}
        {summary_tile("Service Type", work_order.service_type)}
      </div>
      {paragraph_block("Description", work_order.description)}
      {paragraph_block("Completion Notes", work_order.completion_notes)}
      {paragraph_block("Completion Override", work_order.completion_override_reason)}
      {paragraph_block("Client Approval Notes", work_order.client_approval_notes)}
    </section>

    {render_attachments(package)}
    {render_messages("Client Messages", package.client_messages)}
    {render_messages("Internal Notes", package.internal_messages)}
    {render_events(package)}
  </main>
</body>
</html>"""


def build_closeout_text(package: WorkOrderCloseoutPackage) -> str:
    work_order = package.work_order
    lines = [
        f"TechSync Ops Closeout Package - WO #{work_order.id}",
        f"Title: {work_order.title}",
        f"Status: {work_order.status}",
        f"Priority: {work_order.priority}",
        f"Service Type: {work_order.service_type}",
        f"Proof Status: {package.proof_status}",
        f"Client Approval: {work_order.client_approval_status}",
        f"Completed: {format_value(work_order.completed_at)}",
        "",
        "Description:",
        format_value(work_order.description),
        "",
        "Completion Notes:",
        format_value(work_order.completion_notes),
        "",
        "Attachments:",
    ]

    if package.attachments:
        for attachment in package.attachments:
            lines.append(f"- {attachment.file_name}: {attachment.file_url}")
    else:
        lines.append("- None")

    lines.extend(["", "Client Messages:"])
    append_messages(lines, package.client_messages)
    lines.extend(["", "Internal Notes:"])
    append_messages(lines, package.internal_messages)
    lines.extend(["", "Audit Events:"])

    if package.audit_events:
        for event in package.audit_events:
            lines.append(
                f"- {format_value(event.created_at)} | {event.event_type}"
                f" | {format_value(event.notes)}"
            )
    else:
        lines.append("- None")

    return "\n".join(lines) + "\n"


def summary_tile(label: str, value: object) -> str:
    value_text = format_value(value)
    value_class = ""
    if value_text in ("verified", "approved", "completed"):
        value_class = " ok"
    elif value_text in ("missing", "declined", "cancelled"):
        value_class = " danger"
    elif value_text == "pending":
        value_class = " warn"
    return (
        '<div class="tile">'
        f'<div class="label">{escape(label)}</div>'
        f'<div class="value{value_class}">{escape(value_text)}</div>'
        "</div>"
    )


def paragraph_block(label: str, value: object) -> str:
    if not value:
        return ""
    return (
        '<div class="item">'
        f'<div class="label">{escape(label)}</div>'
        f'<div>{escape(format_value(value))}</div>'
        "</div>"
    )


def render_attachments(package: WorkOrderCloseoutPackage) -> str:
    if not package.attachments:
        body = '<div class="item">No attachments recorded.</div>'
    else:
        body = "".join(
            '<div class="item">'
            f'<div class="label">{escape(attachment.content_type or "attachment")}</div>'
            f'<div class="value">{escape(attachment.file_name)}</div>'
            f'<a href="{escape(attachment.file_url)}">{escape(attachment.file_url)}</a>'
            "</div>"
            for attachment in package.attachments
        )
    return f"<section><h2>Attachments</h2>{body}</section>"


def render_messages(label: str, messages: list) -> str:
    if not messages:
        body = '<div class="item">No messages recorded.</div>'
    else:
        body = "".join(
            '<div class="item">'
            f'<div class="label">{escape(format_value(message.created_at))}</div>'
            f'<div>{escape(message.body)}</div>'
            "</div>"
            for message in messages
        )
    return f"<section><h2>{escape(label)}</h2>{body}</section>"


def render_events(package: WorkOrderCloseoutPackage) -> str:
    if not package.audit_events:
        body = '<div class="item">No audit events recorded.</div>'
    else:
        body = "".join(
            '<div class="item">'
            f'<div class="label">{escape(format_value(event.created_at))}</div>'
            f'<div class="value">{escape(event.event_type)}</div>'
            f'<div>{escape(format_value(event.notes))}</div>'
            "</div>"
            for event in package.audit_events
        )
    return f"<section><h2>Audit Events</h2>{body}</section>"


def append_messages(lines: list[str], messages: list) -> None:
    if not messages:
        lines.append("- None")
        return

    for message in messages:
        lines.append(f"- {format_value(message.created_at)} | {message.body}")


def format_value(value: object) -> str:
    if value is None or value == "":
        return "None"
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)

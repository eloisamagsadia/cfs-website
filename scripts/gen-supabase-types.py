#!/usr/bin/env python3
"""
Generate types/supabase.ts from the PostgREST OpenAPI spec.

The Supabase CLI is the normal way to do this, but it needs a login this
environment doesn't have. PostgREST already publishes the same information at
GET /rest/v1/ — every table, column, format, primary key and foreign key — so
we generate from that instead. Output matches the shape supabase-js expects:
Row / Insert / Update per table, plus Relationships, which is what the client
needs to infer joined query results.
"""
import json, re, sys

SPEC, OUT = sys.argv[1], sys.argv[2]
spec = json.load(open(SPEC))
defs = spec["definitions"]

# PostgREST format -> TypeScript type.
SCALAR = {
    "text": "string",
    "uuid": "string",
    "character varying": "string",
    "name": "string",
    "timestamp with time zone": "string",
    "timestamp without time zone": "string",
    "date": "string",
    "time without time zone": "string",
    "boolean": "boolean",
    "integer": "number",
    "bigint": "number",
    "smallint": "number",
    "numeric": "number",
    "double precision": "number",
    "real": "number",
    "jsonb": "Json",
    "json": "Json",
}

def ts_type(meta):
    fmt = meta.get("format") or ""
    if fmt.endswith("[]"):
        inner = SCALAR.get(fmt[:-2], "string")
        return f"{inner}[]"
    if fmt in SCALAR:
        return SCALAR[fmt]
    if meta.get("enum"):
        return " | ".join(f'"{e}"' for e in meta["enum"])
    # Unknown / USER-DEFINED (enums, domains, geometry...). string is the safe
    # read: it never makes a real value unassignable the way `never` would.
    return "string"

FK_RE = re.compile(r"<fk table='([^']+)' column='([^']+)'/>")

def fk_of(meta):
    m = FK_RE.search(meta.get("description") or "")
    return (m.group(1), m.group(2)) if m else None

def has_default(meta):
    return "default" in meta

lines = []
lines.append("// AUTO-GENERATED — do not edit by hand.")
lines.append("//")
lines.append("// Generated from the live PostgREST schema (GET /rest/v1/), which publishes")
lines.append("// every table, column, format, primary key and foreign key. The Supabase CLI")
lines.append("// is the usual generator but requires a login; this produces the same shape.")
lines.append("//")
lines.append("// To regenerate after a migration:")
lines.append("//   curl -sS -H \"apikey: $SUPABASE_SERVICE_ROLE_KEY\" \\")
lines.append("//        -H \"Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY\" \\")
lines.append("//        \"$NEXT_PUBLIC_SUPABASE_URL/rest/v1/\" -o /tmp/openapi.json")
lines.append("//   python3 scripts/gen-supabase-types.py /tmp/openapi.json types/supabase.ts")
lines.append("")
lines.append("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];")
lines.append("")
lines.append("export type Database = {")
lines.append("  public: {")
lines.append("    Tables: {")

for table in sorted(defs):
    meta = defs[table]
    props = meta.get("properties") or {}
    required = set(meta.get("required") or [])
    lines.append(f"      {table}: {{")

    # ── Row ──
    lines.append("        Row: {")
    for col in sorted(props):
        t = ts_type(props[col])
        null = "" if col in required else " | null"
        lines.append(f"          {col}: {t}{null};")
    lines.append("        };")

    # ── Insert ── required-and-no-default columns are mandatory
    lines.append("        Insert: {")
    for col in sorted(props):
        m = props[col]
        t = ts_type(m)
        mandatory = col in required and not has_default(m)
        opt = "" if mandatory else "?"
        null = "" if col in required else " | null"
        lines.append(f"          {col}{opt}: {t}{null};")
    lines.append("        };")

    # ── Update ── everything optional
    lines.append("        Update: {")
    for col in sorted(props):
        t = ts_type(props[col])
        null = "" if col in required else " | null"
        lines.append(f"          {col}?: {t}{null};")
    lines.append("        };")

    # ── Relationships ── what supabase-js needs to infer embedded selects
    rels = []
    for col in sorted(props):
        fk = fk_of(props[col])
        if fk:
            rels.append((col, fk[0], fk[1]))
    if rels:
        lines.append("        Relationships: [")
        for col, ftable, fcol in rels:
            lines.append("          {")
            lines.append(f'            foreignKeyName: "{table}_{col}_fkey";')
            lines.append(f'            columns: ["{col}"];')
            lines.append("            isOneToOne: false;")
            lines.append(f'            referencedRelation: "{ftable}";')
            lines.append(f'            referencedColumns: ["{fcol}"];')
            lines.append("          },")
        lines.append("        ];")
    else:
        lines.append("        Relationships: [];")

    lines.append("      };")

lines.append("    };")
# ── Functions ── RPCs are published under /rpc/* with their arg schema. The
# stub declared Functions as Record<string, never>, which typed every .rpc()
# argument object as `never` — that is what made a valid call fail to compile.
lines.append("    Views: { [_ in never]: never };")
lines.append("    Functions: {")
for path, ops in sorted(spec.get("paths", {}).items()):
    if not path.startswith("/rpc/"):
        continue
    fn = path[len("/rpc/"):]
    post = ops.get("post") or {}
    body = next((pr for pr in post.get("parameters", []) if pr.get("in") == "body"), None)
    schema = (body or {}).get("schema") or {}
    props = schema.get("properties") or {}
    req = set(schema.get("required") or [])
    lines.append(f"      {fn}: {{")
    if props:
        lines.append("        Args: {")
        for a in sorted(props):
            opt = "" if a in req else "?"
            lines.append(f"          {a}{opt}: {ts_type(props[a])};")
        lines.append("        };")
    else:
        lines.append("        Args: Record<PropertyKey, never>;")
    # PostgREST does not describe RPC return types usefully; these are all
    # void / side-effecting here, and `unknown` keeps a caller honest.
    lines.append("        Returns: unknown;")
    lines.append("      };")
lines.append("    };")
lines.append("    Enums: { [_ in never]: never };")
lines.append("    CompositeTypes: { [_ in never]: never };")
lines.append("  };")
lines.append("};")
lines.append("")

open(OUT, "w").write("\n".join(lines))
print(f"wrote {OUT}: {len(defs)} tables, {sum(1 for t in defs for c in (defs[t].get('properties') or {}))} columns")

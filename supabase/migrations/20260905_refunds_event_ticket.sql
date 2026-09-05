-- Widen refunds.entity_type CHECK so self-service tier downgrades can
-- create pending refund rows keyed to the specific ticket (not the
-- whole registration).

alter table public.refunds drop constraint if exists refunds_entity_type_check;
alter table public.refunds
  add constraint refunds_entity_type_check
  check (entity_type in ('order','donation','event_registration','event_ticket'));

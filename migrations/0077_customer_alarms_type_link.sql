-- alarm_type and link_url were already added to production by the lazy ALTER TABLE
-- in insertWorkflowCrossPartyAlarms. This migration is a no-op to register the
-- schema change in the migrations log.
SELECT 1;

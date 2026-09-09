begin;

-- Cover every new foreign key used by operational joins and retention checks.
create index pipeline_item_movements_pipeline_id_idx
  on public.pipeline_item_movements(pipeline_id);

create index pipeline_item_movements_from_stage_id_idx
  on public.pipeline_item_movements(from_stage_id)
  where from_stage_id is not null;

create index pipeline_item_movements_to_stage_id_idx
  on public.pipeline_item_movements(to_stage_id);

create index pipeline_items_created_by_idx
  on public.pipeline_items(created_by)
  where created_by is not null;

create index pipelines_created_by_idx
  on public.pipelines(created_by)
  where created_by is not null;

commit;

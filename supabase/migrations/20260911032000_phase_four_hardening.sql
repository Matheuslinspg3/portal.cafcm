begin;

create index automation_runs_executed_by_idx on public.automation_runs(executed_by) where executed_by is not null;
create index bank_file_batches_created_by_idx on public.bank_file_batches(created_by) where created_by is not null;
create index banking_integrations_created_by_idx on public.banking_integrations(created_by) where created_by is not null;
create index document_generations_generated_by_idx on public.document_generations(generated_by) where generated_by is not null;
create index document_generations_reviewed_by_idx on public.document_generations(reviewed_by) where reviewed_by is not null;
create index document_generations_template_id_idx on public.document_generations(template_id);
create index document_templates_created_by_idx on public.document_templates(created_by) where created_by is not null;
create index email_deliveries_approved_by_idx on public.email_deliveries(approved_by) where approved_by is not null;

drop policy if exists document_templates_cafcm_write on public.document_templates;
create policy document_templates_cafcm_insert on public.document_templates for insert to authenticated
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));
create policy document_templates_cafcm_update on public.document_templates for update to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));
create policy document_templates_cafcm_delete on public.document_templates for delete to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));

drop policy if exists document_generations_cafcm_write on public.document_generations;
create policy document_generations_cafcm_insert on public.document_generations for insert to authenticated
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));
create policy document_generations_cafcm_update on public.document_generations for update to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));
create policy document_generations_cafcm_delete on public.document_generations for delete to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));

drop policy if exists banking_integrations_cafcm_write on public.banking_integrations;
create policy banking_integrations_cafcm_insert on public.banking_integrations for insert to authenticated
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));
create policy banking_integrations_cafcm_update on public.banking_integrations for update to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));
create policy banking_integrations_cafcm_delete on public.banking_integrations for delete to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));

drop policy if exists bank_file_batches_cafcm_write on public.bank_file_batches;
create policy bank_file_batches_cafcm_insert on public.bank_file_batches for insert to authenticated
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));
create policy bank_file_batches_cafcm_update on public.bank_file_batches for update to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));
create policy bank_file_batches_cafcm_delete on public.bank_file_batches for delete to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));

commit;

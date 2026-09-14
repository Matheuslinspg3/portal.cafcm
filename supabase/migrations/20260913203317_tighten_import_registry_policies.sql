begin;

drop policy if exists apprentice_registry_admin_select on public.apprentice_registry;
drop policy if exists apprentice_registry_company_select on public.apprentice_registry;
create policy apprentice_registry_select
  on public.apprentice_registry for select to authenticated
  using (
    ((select private.current_portal_role()) = 'cafcm_admin' and (select private.has_portal_permission('directory.read')))
    or
    ((select private.current_portal_role()) = 'company' and company_id = (select private.current_company_id()))
  );

drop policy if exists apprentice_contract_registry_admin_select on public.apprentice_contract_registry;
drop policy if exists apprentice_contract_registry_company_select on public.apprentice_contract_registry;
create policy apprentice_contract_registry_select
  on public.apprentice_contract_registry for select to authenticated
  using (
    ((select private.current_portal_role()) = 'cafcm_admin' and (select private.has_portal_permission('contracts.read')))
    or
    ((select private.current_portal_role()) = 'company' and company_id = (select private.current_company_id()))
  );

commit;

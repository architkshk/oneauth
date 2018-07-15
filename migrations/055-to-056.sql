ALTER TABLE public.addresses ADD COLUMN whatsapp varchar(10) default null unique;
alter table public.addresses alter column label varchar(255) default null;
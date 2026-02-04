drop extension if exists "pg_net";

create sequence "public"."WaitlistAnswer_id_seq";

create sequence "public"."WaitlistSubscriber_id_seq";


  create table "public"."EmailLog" (
    "id" text not null,
    "subscriberId" integer not null,
    "templateId" text not null,
    "status" text not null,
    "response" jsonb,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP
      );



  create table "public"."EmailTemplate" (
    "id" text not null,
    "name" text not null,
    "description" text,
    "zeptomailTemplateId" text not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP
      );



  create table "public"."WaitlistAnswer" (
    "id" integer not null default nextval('public."WaitlistAnswer_id_seq"'::regclass),
    "subscriberId" integer not null,
    "destination" text,
    "nextFlightTime" text,
    "preferredChannels" text[],
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP
      );



  create table "public"."WaitlistSubscriber" (
    "id" integer not null default nextval('public."WaitlistSubscriber_id_seq"'::regclass),
    "email" text not null,
    "subscribedAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "firstname" text,
    "lastname" text,
    "isUnsubscribed" boolean not null default false,
    "unsubscribeToken" text not null
      );


alter sequence "public"."WaitlistAnswer_id_seq" owned by "public"."WaitlistAnswer"."id";

alter sequence "public"."WaitlistSubscriber_id_seq" owned by "public"."WaitlistSubscriber"."id";

CREATE UNIQUE INDEX "EmailLog_pkey" ON public."EmailLog" USING btree (id);

CREATE UNIQUE INDEX "EmailTemplate_name_key" ON public."EmailTemplate" USING btree (name);

CREATE UNIQUE INDEX "EmailTemplate_pkey" ON public."EmailTemplate" USING btree (id);

CREATE UNIQUE INDEX "WaitlistAnswer_pkey" ON public."WaitlistAnswer" USING btree (id);

CREATE UNIQUE INDEX "WaitlistAnswer_subscriberId_key" ON public."WaitlistAnswer" USING btree ("subscriberId");

CREATE UNIQUE INDEX "WaitlistSubscriber_email_key" ON public."WaitlistSubscriber" USING btree (email);

CREATE UNIQUE INDEX "WaitlistSubscriber_pkey" ON public."WaitlistSubscriber" USING btree (id);

CREATE UNIQUE INDEX "WaitlistSubscriber_unsubscribeToken_key" ON public."WaitlistSubscriber" USING btree ("unsubscribeToken");

alter table "public"."EmailLog" add constraint "EmailLog_pkey" PRIMARY KEY using index "EmailLog_pkey";

alter table "public"."EmailTemplate" add constraint "EmailTemplate_pkey" PRIMARY KEY using index "EmailTemplate_pkey";

alter table "public"."WaitlistAnswer" add constraint "WaitlistAnswer_pkey" PRIMARY KEY using index "WaitlistAnswer_pkey";

alter table "public"."WaitlistSubscriber" add constraint "WaitlistSubscriber_pkey" PRIMARY KEY using index "WaitlistSubscriber_pkey";

alter table "public"."EmailLog" add constraint "EmailLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES public."WaitlistSubscriber"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."EmailLog" validate constraint "EmailLog_subscriberId_fkey";

alter table "public"."EmailLog" add constraint "EmailLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."EmailTemplate"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."EmailLog" validate constraint "EmailLog_templateId_fkey";

alter table "public"."WaitlistAnswer" add constraint "WaitlistAnswer_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES public."WaitlistSubscriber"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."WaitlistAnswer" validate constraint "WaitlistAnswer_subscriberId_fkey";

grant delete on table "public"."flight_subscriptions" to "prisma";

grant insert on table "public"."flight_subscriptions" to "prisma";

grant references on table "public"."flight_subscriptions" to "prisma";

grant select on table "public"."flight_subscriptions" to "prisma";

grant trigger on table "public"."flight_subscriptions" to "prisma";

grant truncate on table "public"."flight_subscriptions" to "prisma";

grant update on table "public"."flight_subscriptions" to "prisma";

grant delete on table "public"."flights" to "prisma";

grant insert on table "public"."flights" to "prisma";

grant references on table "public"."flights" to "prisma";

grant select on table "public"."flights" to "prisma";

grant trigger on table "public"."flights" to "prisma";

grant truncate on table "public"."flights" to "prisma";

grant update on table "public"."flights" to "prisma";

grant delete on table "public"."message_events" to "prisma";

grant insert on table "public"."message_events" to "prisma";

grant references on table "public"."message_events" to "prisma";

grant select on table "public"."message_events" to "prisma";

grant trigger on table "public"."message_events" to "prisma";

grant truncate on table "public"."message_events" to "prisma";

grant update on table "public"."message_events" to "prisma";

grant delete on table "public"."messages" to "prisma";

grant insert on table "public"."messages" to "prisma";

grant references on table "public"."messages" to "prisma";

grant select on table "public"."messages" to "prisma";

grant trigger on table "public"."messages" to "prisma";

grant truncate on table "public"."messages" to "prisma";

grant update on table "public"."messages" to "prisma";

grant delete on table "public"."receivers" to "prisma";

grant insert on table "public"."receivers" to "prisma";

grant references on table "public"."receivers" to "prisma";

grant select on table "public"."receivers" to "prisma";

grant trigger on table "public"."receivers" to "prisma";

grant truncate on table "public"."receivers" to "prisma";

grant update on table "public"."receivers" to "prisma";

grant delete on table "public"."scheduler_locks" to "prisma";

grant insert on table "public"."scheduler_locks" to "prisma";

grant references on table "public"."scheduler_locks" to "prisma";

grant select on table "public"."scheduler_locks" to "prisma";

grant trigger on table "public"."scheduler_locks" to "prisma";

grant truncate on table "public"."scheduler_locks" to "prisma";

grant update on table "public"."scheduler_locks" to "prisma";

grant delete on table "public"."subscription_receivers" to "prisma";

grant insert on table "public"."subscription_receivers" to "prisma";

grant references on table "public"."subscription_receivers" to "prisma";

grant select on table "public"."subscription_receivers" to "prisma";

grant trigger on table "public"."subscription_receivers" to "prisma";

grant truncate on table "public"."subscription_receivers" to "prisma";

grant update on table "public"."subscription_receivers" to "prisma";

grant delete on table "public"."traveller_receiver_links" to "prisma";

grant insert on table "public"."traveller_receiver_links" to "prisma";

grant references on table "public"."traveller_receiver_links" to "prisma";

grant select on table "public"."traveller_receiver_links" to "prisma";

grant trigger on table "public"."traveller_receiver_links" to "prisma";

grant truncate on table "public"."traveller_receiver_links" to "prisma";

grant update on table "public"."traveller_receiver_links" to "prisma";

grant delete on table "public"."travellers" to "prisma";

grant insert on table "public"."travellers" to "prisma";

grant references on table "public"."travellers" to "prisma";

grant select on table "public"."travellers" to "prisma";

grant trigger on table "public"."travellers" to "prisma";

grant truncate on table "public"."travellers" to "prisma";

grant update on table "public"."travellers" to "prisma";

grant delete on table "public"."webhook_events" to "prisma";

grant insert on table "public"."webhook_events" to "prisma";

grant references on table "public"."webhook_events" to "prisma";

grant select on table "public"."webhook_events" to "prisma";

grant trigger on table "public"."webhook_events" to "prisma";

grant truncate on table "public"."webhook_events" to "prisma";

grant update on table "public"."webhook_events" to "prisma";

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();



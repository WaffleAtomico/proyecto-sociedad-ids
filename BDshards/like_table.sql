create table public."Like" (
  id uuid not null default gen_random_uuid (),
  "userId" uuid not null,
  "blogId" uuid null,
  "commentId" uuid null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  constraint "Like_pkey" primary key (id),
  constraint "Like_blogId_fkey" foreign KEY ("blogId") references "Blog" (id) on delete CASCADE,
  constraint "Like_commentId_fkey" foreign KEY ("commentId") references "Comment" (id) on delete CASCADE,
  constraint "Like_userId_fkey" foreign KEY ("userId") references "User" (id) on delete CASCADE,
  constraint "Like_exactly_one_target" check (
    (
      (
        ("blogId" is not null)
        and ("commentId" is null)
      )
      or (
        ("blogId" is null)
        and ("commentId" is not null)
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists "Like_unique_user_blog" on public."Like" using btree ("userId", "blogId") TABLESPACE pg_default
where
  ("blogId" is not null);

create unique INDEX IF not exists "Like_unique_user_comment" on public."Like" using btree ("userId", "commentId") TABLESPACE pg_default
where
  ("commentId" is not null);

create index IF not exists "Like_userId_index" on public."Like" using btree ("userId") TABLESPACE pg_default;

create trigger "Like_update_counter"
after INSERT
or DELETE on "Like" for EACH row
execute FUNCTION sync_like_count ();
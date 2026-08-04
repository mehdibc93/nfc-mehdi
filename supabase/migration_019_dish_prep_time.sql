alter table dishes add column if not exists prep_time_minutes integer check (prep_time_minutes is null or prep_time_minutes >= 0);

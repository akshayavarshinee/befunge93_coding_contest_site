-- Teams table
CREATE TABLE IF NOT EXISTS public.teams
(
    id serial PRIMARY KEY,
    team_name text NOT NULL,
    tl_email text NOT NULL UNIQUE,
    password_hash text
);

-- Users table (Members)
CREATE TABLE IF NOT EXISTS public.users
(
    id serial PRIMARY KEY,
    team_id integer NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    college character varying(255) NOT NULL
);

-- Admins table
CREATE TABLE IF NOT EXISTS public.admins
(
    id serial PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255) NOT NULL,
    username character varying(30) NOT NULL UNIQUE
);

-- Contests table
CREATE TABLE IF NOT EXISTS public.contests
(
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    description text,
    duration integer, -- in minutes
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    is_paused boolean DEFAULT false,
    last_state_change_at timestamp without time zone,
    total_active_seconds integer NOT NULL DEFAULT 0
);

-- Problems table
CREATE TABLE IF NOT EXISTS public.problems
(
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    description text,
    input_format text,
    output_format text,
    example_input text,
    example_output text
);

-- Contest problems mapping table
CREATE TABLE IF NOT EXISTS public.contest_problems
(
    contest_id integer NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id integer NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    points integer DEFAULT 100,
    "order" integer DEFAULT 0,
    PRIMARY KEY (contest_id, problem_id)
);

-- Test cases table
CREATE TABLE IF NOT EXISTS public.test_cases
(
    id serial PRIMARY KEY,
    problem_id integer REFERENCES public.problems(id) ON DELETE CASCADE,
    input text NOT NULL,
    expected_output text NOT NULL,
    is_hidden boolean DEFAULT true
);

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions
(
    id serial PRIMARY KEY,
    problem_id integer REFERENCES public.problems(id) ON DELETE CASCADE,
    contest_id integer REFERENCES public.contests(id) ON DELETE CASCADE,
    team_id integer NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verdict character varying(50),
    code text,
    solve_time integer DEFAULT 0
);

-- Leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard
(
    id serial PRIMARY KEY,
    contest_id integer REFERENCES public.contests(id) ON DELETE CASCADE,
    team_id integer NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    team_name text,
    total_score integer DEFAULT 0,
    total_time integer DEFAULT 0,
    violation_count integer DEFAULT 0,
    UNIQUE (team_id, contest_id)
);

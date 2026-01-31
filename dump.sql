--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    username character varying(30) NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: contest_problems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contest_problems (
    contest_id integer NOT NULL,
    problem_id integer NOT NULL,
    points integer DEFAULT 100,
    "order" integer DEFAULT 0
);


ALTER TABLE public.contest_problems OWNER TO postgres;

--
-- Name: contests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration integer,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    is_paused boolean DEFAULT false,
    remaining_time integer
);


ALTER TABLE public.contests OWNER TO postgres;

--
-- Name: contests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contests_id_seq OWNER TO postgres;

--
-- Name: contests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contests_id_seq OWNED BY public.contests.id;


--
-- Name: leaderboard; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaderboard (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    contest_id integer,
    total_score integer DEFAULT 0,
    total_time integer DEFAULT 0,
    violation_count integer
);


ALTER TABLE public.leaderboard OWNER TO postgres;

--
-- Name: leaderboard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leaderboard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leaderboard_id_seq OWNER TO postgres;

--
-- Name: leaderboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leaderboard_id_seq OWNED BY public.leaderboard.id;


--
-- Name: problems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.problems (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    input_format text,
    output_format text,
    example_input text,
    example_output text
);


ALTER TABLE public.problems OWNER TO postgres;

--
-- Name: problems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.problems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problems_id_seq OWNER TO postgres;

--
-- Name: problems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.problems_id_seq OWNED BY public.problems.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    user_id integer,
    problem_id integer,
    contest_id integer,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verdict character varying(50),
    code text
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: test_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_cases (
    id integer NOT NULL,
    problem_id integer,
    input text NOT NULL,
    expected_output text NOT NULL,
    is_hidden boolean DEFAULT true
);


ALTER TABLE public.test_cases OWNER TO postgres;

--
-- Name: test_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_cases_id_seq OWNER TO postgres;

--
-- Name: test_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_cases_id_seq OWNED BY public.test_cases.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    username character varying(30) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: contests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contests ALTER COLUMN id SET DEFAULT nextval('public.contests_id_seq'::regclass);


--
-- Name: leaderboard id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaderboard ALTER COLUMN id SET DEFAULT nextval('public.leaderboard_id_seq'::regclass);


--
-- Name: problems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problems ALTER COLUMN id SET DEFAULT nextval('public.problems_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: test_cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases ALTER COLUMN id SET DEFAULT nextval('public.test_cases_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, username) FROM stdin;
3	akshaya.murugu@gmail.com	$2b$10$igh95BdFfavmTvMtnoKloOnnOrqVgZ94v9SXqbOJzoQzxlWn6lDha	akshaya_varshinee
4	admin@test.com	$2b$10$n6ermHClrcpyHH7X8GiZau4KQRg1y5TuSwNw2G.gVagaa1UEwOi3W	testadmin
5	makshayavarshinee.aids2024@citchennai.net	$2b$10$Z6niXCYtgjZtxuEGfdN3quu/8JadFImxvViV1A89A.D65p9BNnDtq	m_akshaya_varshinee
6	nethrapraveenkumar.aids2024@citchennai.net	$2b$10$UeVWr9r7VFd4SCdyBaIsHejooe96SquwGTefd/DgVbrkBo5/OaLt2	nethra
7	jeyaguruj.aids2024@citchennai.net	$2b$10$l3.RCTXccXtLkQib8s9qS.KnM6vy/tIfgBSwvtwM9kbvqcPY4Wr1W	jeyaguru_j
8	abishekk.aids2024@citchennai.net	$2b$10$MZrgerFSFAGIVwVKAzkIIeiXQhg3dpVvCh42uZiuyHS8a7QuifTLe	abishek_k
9	nithyasris.aids2023@citchennai.net	$2b$10$Fiss9M9Vh680CJDgJY4UKOVJ7Ym9AJpI.4yy/tp4IgCrs1tbx.6Q.	nithya_sri_s
10	nafilanazrinn.aids2023@citchennai.net	$2b$10$xazxfF1gZ.v6WAPJNHIPW.oN74oX/2oPB/RLHLnVHE8PunIVWTx4W	nafila_nazrin_n
11	madhumithaj.aids2023@citchennai.net	$2b$10$9OQomw5KI/xj7KG8u2tGYu.e0Dn/f4l8w1EC2i.rLePPrAmsxoc5u	madhumitha_j
12	ilakkyaavs.aids2023@citchennai.net	$2b$10$rS/Wun.J8ocvRzwRstX7mu6utIRH3kaPhu/Y/OYscWEBjhDEupqi6	ilakkyaa_v_s
\.


--
-- Data for Name: contest_problems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contest_problems (contest_id, problem_id, points, "order") FROM stdin;
13	20	100	0
13	12	100	0
13	21	99	0
13	22	100	0
\.


--
-- Data for Name: contests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contests (id, name, description, duration, start_time, end_time, is_paused, remaining_time) FROM stdin;
13	Test	\N	180	2026-01-29 21:12:57.499165	2026-01-30 00:12:57.499165	f	0
\.


--
-- Data for Name: leaderboard; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaderboard (id, username, contest_id, total_score, total_time, violation_count) FROM stdin;
673	test	13	0	0	13
\.


--
-- Data for Name: problems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.problems (id, name, description, input_format, output_format, example_input, example_output) FROM stdin;
19	positive or not					
12	Hello	print hello	nothing	hello	""	"hello"
20	Joy	print "joy"	nothing	joy		
21	Apple	Print apple				
22	Fibonacci Generator					
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, user_id, problem_id, contest_id, submitted_at, verdict, code) FROM stdin;
5935	4	22	13	2026-01-29 21:15:07.961	TLE	&09p019p129p>09g::1`#v_0.@\r\n                     >2`#v_10..@\r\nv                   -2g90<\r\n>10..>09g1-0`                        #v_@\r\n     ^p92p91g92p93.::+g92<g91<p90-1g90<\r\n
5936	4	22	13	2026-01-29 21:16:08.449	WA	&09p019p129p>09g::1`#v_0.@\r\n                     >2`#v_10..@\r\nv                   -2g90<\r\n>10..>09g1-0`                        #v_@\r\n     ^p92p91g92p93.::+g92<g91<p90-1g90<\r\n
5937	4	22	13	2026-01-29 21:16:25.726	WA	&09p019p129p>09g::1`#v_0.@\r\n                     >2`#v_10..@\r\nv                   -2g90<\r\n>10..>09g2-0`                        #v_@\r\n     ^p92p91g92p93.::+g92<g91<p90-1g90<\r\n
5938	4	22	13	2026-01-29 21:20:10.59	TLE	&09p019p129p>09g::1`#v_0.@\r\n                     >2`#v_10..@\r\n            v       -2g90<\r\n            >10..>09g1-0`                   #v_@\r\n            ^p92p91g92p93.::+g92<g91<p90-1g90<\r\n
5939	4	22	13	2026-01-29 21:37:10.076	TLE	&09p019p129p>09g::1`#v_0.@\r\n                     >2`#v_10..@\r\nv                   -2g90<\r\n>10..>09g1-0`                        #v_@\r\n     ^p92p91g92p93.::+g92<g91<p90-1g90<\r\n
\.


--
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_cases (id, problem_id, input, expected_output, is_hidden) FROM stdin;
5	19	5	1	t
6	19	-3		t
7	19		1	t
8	19	10	1	t
9	19	-99		t
10	19	1	1	t
11	19	-1		t
12	19	42	1	t
13	19	-2024		t
14	19	999	1	t
15	12		hello	t
16	20		joy	t
17	21		apple	t
18	22	1	0	t
19	22	20	0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181 6765	t
20	22	10	0 1 1 2 3 5 8 13 21 34 55 	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, username) FROM stdin;
4	test@gmail.com	$2b$10$BBXUJ0lXLTJtB8F/Bn568ee74jAQ7h3MtD1p5NWVBn4zXSCZqdaLq	test
5	test2@gmail.com	$2b$10$FDf8iQFZvUsdQW659ZMV2.w9zgtpo9Smg.hLEC67/ToYzds785eSS	test2
6	nethra@gmail.com	$2b$10$4NTw89GbrSm3.K1IKbVI4.J.JEJCLu.eteoRFZdCcWtnPT9oQmj4m	nethra
1	user1@gmail.com	test123	user1
2	user2@gmail.com	test123	user2
3	user3@gmail.com	test123	user3
7	user7@gmail.com	test123	user7
8	user8@gmail.com	test123	user8
9	user9@gmail.com	test123	user9
10	user10@gmail.com	test123	user10
11	user11@gmail.com	test123	user11
12	user12@gmail.com	test123	user12
13	user13@gmail.com	test123	user13
14	user14@gmail.com	test123	user14
15	user15@gmail.com	test123	user15
16	user16@gmail.com	test123	user16
17	user17@gmail.com	test123	user17
18	user18@gmail.com	test123	user18
19	user19@gmail.com	test123	user19
20	user20@gmail.com	test123	user20
21	user21@gmail.com	test123	user21
22	user22@gmail.com	test123	user22
23	user23@gmail.com	test123	user23
24	user24@gmail.com	test123	user24
25	user25@gmail.com	test123	user25
26	user26@gmail.com	test123	user26
27	user27@gmail.com	test123	user27
28	user28@gmail.com	test123	user28
29	user29@gmail.com	test123	user29
30	user30@gmail.com	test123	user30
31	user31@gmail.com	test123	user31
32	user32@gmail.com	test123	user32
33	user33@gmail.com	test123	user33
34	user34@gmail.com	test123	user34
35	user35@gmail.com	test123	user35
36	user36@gmail.com	test123	user36
37	user37@gmail.com	test123	user37
38	user38@gmail.com	test123	user38
39	user39@gmail.com	test123	user39
40	user40@gmail.com	test123	user40
41	user41@gmail.com	test123	user41
42	user42@gmail.com	test123	user42
43	user43@gmail.com	test123	user43
44	user44@gmail.com	test123	user44
45	user45@gmail.com	test123	user45
46	user46@gmail.com	test123	user46
47	user47@gmail.com	test123	user47
48	user48@gmail.com	test123	user48
49	user49@gmail.com	test123	user49
50	user50@gmail.com	test123	user50
51	user51@gmail.com	test123	user51
52	user52@gmail.com	test123	user52
53	user53@gmail.com	test123	user53
54	user54@gmail.com	test123	user54
55	user55@gmail.com	test123	user55
56	user56@gmail.com	test123	user56
57	user57@gmail.com	test123	user57
58	user58@gmail.com	test123	user58
59	user59@gmail.com	test123	user59
60	user60@gmail.com	test123	user60
61	user61@gmail.com	test123	user61
62	user62@gmail.com	test123	user62
63	user63@gmail.com	test123	user63
64	user64@gmail.com	test123	user64
65	user65@gmail.com	test123	user65
66	user66@gmail.com	test123	user66
67	user67@gmail.com	test123	user67
68	user68@gmail.com	test123	user68
69	user69@gmail.com	test123	user69
70	user70@gmail.com	test123	user70
71	user71@gmail.com	test123	user71
72	user72@gmail.com	test123	user72
73	user73@gmail.com	test123	user73
74	user74@gmail.com	test123	user74
75	user75@gmail.com	test123	user75
76	user76@gmail.com	test123	user76
77	user77@gmail.com	test123	user77
78	user78@gmail.com	test123	user78
79	user79@gmail.com	test123	user79
80	user80@gmail.com	test123	user80
81	user81@gmail.com	test123	user81
82	user82@gmail.com	test123	user82
83	user83@gmail.com	test123	user83
84	user84@gmail.com	test123	user84
85	user85@gmail.com	test123	user85
86	user86@gmail.com	test123	user86
87	user87@gmail.com	test123	user87
88	user88@gmail.com	test123	user88
89	user89@gmail.com	test123	user89
90	user90@gmail.com	test123	user90
91	user91@gmail.com	test123	user91
92	user92@gmail.com	test123	user92
93	user93@gmail.com	test123	user93
94	user94@gmail.com	test123	user94
95	user95@gmail.com	test123	user95
96	user96@gmail.com	test123	user96
97	user97@gmail.com	test123	user97
98	user98@gmail.com	test123	user98
99	user99@gmail.com	test123	user99
100	user100@gmail.com	test123	user100
101	user101@gmail.com	test123	user101
102	user102@gmail.com	test123	user102
103	user103@gmail.com	test123	user103
104	user104@gmail.com	test123	user104
105	user105@gmail.com	test123	user105
106	user106@gmail.com	test123	user106
107	user107@gmail.com	test123	user107
108	user108@gmail.com	test123	user108
109	user109@gmail.com	test123	user109
110	user110@gmail.com	test123	user110
111	user111@gmail.com	test123	user111
112	user112@gmail.com	test123	user112
113	user113@gmail.com	test123	user113
114	user114@gmail.com	test123	user114
115	user115@gmail.com	test123	user115
116	user116@gmail.com	test123	user116
117	user117@gmail.com	test123	user117
118	user118@gmail.com	test123	user118
119	user119@gmail.com	test123	user119
120	user120@gmail.com	test123	user120
121	user121@gmail.com	test123	user121
122	user122@gmail.com	test123	user122
123	user123@gmail.com	test123	user123
124	user124@gmail.com	test123	user124
125	user125@gmail.com	test123	user125
126	user126@gmail.com	test123	user126
127	user127@gmail.com	test123	user127
128	user128@gmail.com	test123	user128
129	user129@gmail.com	test123	user129
130	user130@gmail.com	test123	user130
131	user131@gmail.com	test123	user131
132	user132@gmail.com	test123	user132
133	user133@gmail.com	test123	user133
134	user134@gmail.com	test123	user134
135	user135@gmail.com	test123	user135
136	user136@gmail.com	test123	user136
137	user137@gmail.com	test123	user137
138	user138@gmail.com	test123	user138
139	user139@gmail.com	test123	user139
140	user140@gmail.com	test123	user140
141	user141@gmail.com	test123	user141
142	user142@gmail.com	test123	user142
143	user143@gmail.com	test123	user143
144	user144@gmail.com	test123	user144
145	user145@gmail.com	test123	user145
146	user146@gmail.com	test123	user146
147	user147@gmail.com	test123	user147
148	user148@gmail.com	test123	user148
149	user149@gmail.com	test123	user149
150	user150@gmail.com	test123	user150
151	user151@gmail.com	test123	user151
152	user152@gmail.com	test123	user152
153	user153@gmail.com	test123	user153
154	user154@gmail.com	test123	user154
155	user155@gmail.com	test123	user155
156	user156@gmail.com	test123	user156
157	user157@gmail.com	test123	user157
158	user158@gmail.com	test123	user158
159	user159@gmail.com	test123	user159
160	user160@gmail.com	test123	user160
161	user161@gmail.com	test123	user161
162	user162@gmail.com	test123	user162
163	user163@gmail.com	test123	user163
164	user164@gmail.com	test123	user164
165	user165@gmail.com	test123	user165
166	user166@gmail.com	test123	user166
167	user167@gmail.com	test123	user167
168	user168@gmail.com	test123	user168
169	user169@gmail.com	test123	user169
170	user170@gmail.com	test123	user170
171	user171@gmail.com	test123	user171
172	user172@gmail.com	test123	user172
173	user173@gmail.com	test123	user173
174	user174@gmail.com	test123	user174
175	user175@gmail.com	test123	user175
176	user176@gmail.com	test123	user176
177	user177@gmail.com	test123	user177
178	user178@gmail.com	test123	user178
179	user179@gmail.com	test123	user179
180	user180@gmail.com	test123	user180
181	user181@gmail.com	test123	user181
182	user182@gmail.com	test123	user182
183	user183@gmail.com	test123	user183
184	user184@gmail.com	test123	user184
185	user185@gmail.com	test123	user185
186	user186@gmail.com	test123	user186
187	user187@gmail.com	test123	user187
188	user188@gmail.com	test123	user188
189	user189@gmail.com	test123	user189
190	user190@gmail.com	test123	user190
191	user191@gmail.com	test123	user191
192	user192@gmail.com	test123	user192
193	user193@gmail.com	test123	user193
194	user194@gmail.com	test123	user194
195	user195@gmail.com	test123	user195
196	user196@gmail.com	test123	user196
197	user197@gmail.com	test123	user197
198	user198@gmail.com	test123	user198
199	user199@gmail.com	test123	user199
200	user200@gmail.com	test123	user200
201	user201@gmail.com	test123	user201
202	user202@gmail.com	test123	user202
203	user203@gmail.com	test123	user203
204	user204@gmail.com	test123	user204
205	user205@gmail.com	test123	user205
206	user206@gmail.com	test123	user206
207	user207@gmail.com	test123	user207
208	user208@gmail.com	test123	user208
209	user209@gmail.com	test123	user209
210	user210@gmail.com	test123	user210
211	user211@gmail.com	test123	user211
212	user212@gmail.com	test123	user212
213	user213@gmail.com	test123	user213
214	user214@gmail.com	test123	user214
215	user215@gmail.com	test123	user215
216	user216@gmail.com	test123	user216
217	user217@gmail.com	test123	user217
218	user218@gmail.com	test123	user218
219	user219@gmail.com	test123	user219
220	user220@gmail.com	test123	user220
221	user221@gmail.com	test123	user221
222	user222@gmail.com	test123	user222
223	user223@gmail.com	test123	user223
224	user224@gmail.com	test123	user224
225	user225@gmail.com	test123	user225
226	user226@gmail.com	test123	user226
227	user227@gmail.com	test123	user227
228	user228@gmail.com	test123	user228
229	user229@gmail.com	test123	user229
230	user230@gmail.com	test123	user230
231	user231@gmail.com	test123	user231
232	user232@gmail.com	test123	user232
233	user233@gmail.com	test123	user233
234	user234@gmail.com	test123	user234
235	user235@gmail.com	test123	user235
236	user236@gmail.com	test123	user236
237	user237@gmail.com	test123	user237
238	user238@gmail.com	test123	user238
239	user239@gmail.com	test123	user239
240	user240@gmail.com	test123	user240
241	user241@gmail.com	test123	user241
242	user242@gmail.com	test123	user242
243	user243@gmail.com	test123	user243
244	user244@gmail.com	test123	user244
245	user245@gmail.com	test123	user245
246	user246@gmail.com	test123	user246
247	user247@gmail.com	test123	user247
248	user248@gmail.com	test123	user248
249	user249@gmail.com	test123	user249
250	user250@gmail.com	test123	user250
251	user251@gmail.com	test123	user251
252	user252@gmail.com	test123	user252
253	user253@gmail.com	test123	user253
254	user254@gmail.com	test123	user254
255	user255@gmail.com	test123	user255
256	user256@gmail.com	test123	user256
257	user257@gmail.com	test123	user257
258	user258@gmail.com	test123	user258
259	user259@gmail.com	test123	user259
260	user260@gmail.com	test123	user260
261	user261@gmail.com	test123	user261
262	user262@gmail.com	test123	user262
263	user263@gmail.com	test123	user263
264	user264@gmail.com	test123	user264
265	user265@gmail.com	test123	user265
266	user266@gmail.com	test123	user266
267	user267@gmail.com	test123	user267
268	user268@gmail.com	test123	user268
269	user269@gmail.com	test123	user269
270	user270@gmail.com	test123	user270
271	user271@gmail.com	test123	user271
272	user272@gmail.com	test123	user272
273	user273@gmail.com	test123	user273
274	user274@gmail.com	test123	user274
275	user275@gmail.com	test123	user275
276	user276@gmail.com	test123	user276
277	user277@gmail.com	test123	user277
278	user278@gmail.com	test123	user278
279	user279@gmail.com	test123	user279
280	user280@gmail.com	test123	user280
281	user281@gmail.com	test123	user281
282	user282@gmail.com	test123	user282
283	user283@gmail.com	test123	user283
284	user284@gmail.com	test123	user284
285	user285@gmail.com	test123	user285
286	user286@gmail.com	test123	user286
287	user287@gmail.com	test123	user287
288	user288@gmail.com	test123	user288
289	user289@gmail.com	test123	user289
290	user290@gmail.com	test123	user290
291	user291@gmail.com	test123	user291
292	user292@gmail.com	test123	user292
293	user293@gmail.com	test123	user293
294	user294@gmail.com	test123	user294
295	user295@gmail.com	test123	user295
296	user296@gmail.com	test123	user296
297	user297@gmail.com	test123	user297
298	user298@gmail.com	test123	user298
299	user299@gmail.com	test123	user299
300	user300@gmail.com	test123	user300
301	user301@gmail.com	test123	user301
302	user302@gmail.com	test123	user302
303	user303@gmail.com	test123	user303
304	user304@gmail.com	test123	user304
305	user305@gmail.com	test123	user305
306	user306@gmail.com	test123	user306
307	user307@gmail.com	test123	user307
308	user308@gmail.com	test123	user308
309	user309@gmail.com	test123	user309
310	user310@gmail.com	test123	user310
311	user311@gmail.com	test123	user311
312	user312@gmail.com	test123	user312
313	user313@gmail.com	test123	user313
314	user314@gmail.com	test123	user314
315	user315@gmail.com	test123	user315
316	user316@gmail.com	test123	user316
317	user317@gmail.com	test123	user317
318	user318@gmail.com	test123	user318
319	user319@gmail.com	test123	user319
320	user320@gmail.com	test123	user320
321	user321@gmail.com	test123	user321
322	user322@gmail.com	test123	user322
323	user323@gmail.com	test123	user323
324	user324@gmail.com	test123	user324
325	user325@gmail.com	test123	user325
326	user326@gmail.com	test123	user326
327	user327@gmail.com	test123	user327
328	user328@gmail.com	test123	user328
329	user329@gmail.com	test123	user329
330	user330@gmail.com	test123	user330
331	user331@gmail.com	test123	user331
332	user332@gmail.com	test123	user332
333	user333@gmail.com	test123	user333
334	user334@gmail.com	test123	user334
335	user335@gmail.com	test123	user335
336	user336@gmail.com	test123	user336
337	user337@gmail.com	test123	user337
338	user338@gmail.com	test123	user338
339	user339@gmail.com	test123	user339
340	user340@gmail.com	test123	user340
341	user341@gmail.com	test123	user341
342	user342@gmail.com	test123	user342
343	user343@gmail.com	test123	user343
344	user344@gmail.com	test123	user344
345	user345@gmail.com	test123	user345
346	user346@gmail.com	test123	user346
347	user347@gmail.com	test123	user347
348	user348@gmail.com	test123	user348
349	user349@gmail.com	test123	user349
350	user350@gmail.com	test123	user350
351	user351@gmail.com	test123	user351
352	user352@gmail.com	test123	user352
353	user353@gmail.com	test123	user353
354	user354@gmail.com	test123	user354
355	user355@gmail.com	test123	user355
356	user356@gmail.com	test123	user356
357	user357@gmail.com	test123	user357
358	user358@gmail.com	test123	user358
359	user359@gmail.com	test123	user359
360	user360@gmail.com	test123	user360
361	user361@gmail.com	test123	user361
362	user362@gmail.com	test123	user362
363	user363@gmail.com	test123	user363
364	user364@gmail.com	test123	user364
365	user365@gmail.com	test123	user365
366	user366@gmail.com	test123	user366
367	user367@gmail.com	test123	user367
368	user368@gmail.com	test123	user368
369	user369@gmail.com	test123	user369
370	user370@gmail.com	test123	user370
371	user371@gmail.com	test123	user371
372	user372@gmail.com	test123	user372
373	user373@gmail.com	test123	user373
374	user374@gmail.com	test123	user374
375	user375@gmail.com	test123	user375
376	user376@gmail.com	test123	user376
377	user377@gmail.com	test123	user377
378	user378@gmail.com	test123	user378
379	user379@gmail.com	test123	user379
380	user380@gmail.com	test123	user380
381	user381@gmail.com	test123	user381
382	user382@gmail.com	test123	user382
383	user383@gmail.com	test123	user383
384	user384@gmail.com	test123	user384
385	user385@gmail.com	test123	user385
386	user386@gmail.com	test123	user386
387	user387@gmail.com	test123	user387
388	user388@gmail.com	test123	user388
389	user389@gmail.com	test123	user389
390	user390@gmail.com	test123	user390
391	user391@gmail.com	test123	user391
392	user392@gmail.com	test123	user392
393	user393@gmail.com	test123	user393
394	user394@gmail.com	test123	user394
395	user395@gmail.com	test123	user395
396	user396@gmail.com	test123	user396
397	user397@gmail.com	test123	user397
398	user398@gmail.com	test123	user398
399	user399@gmail.com	test123	user399
400	user400@gmail.com	test123	user400
401	user401@gmail.com	test123	user401
402	user402@gmail.com	test123	user402
403	user403@gmail.com	test123	user403
404	user404@gmail.com	test123	user404
405	user405@gmail.com	test123	user405
406	user406@gmail.com	test123	user406
407	user407@gmail.com	test123	user407
408	user408@gmail.com	test123	user408
409	user409@gmail.com	test123	user409
410	user410@gmail.com	test123	user410
411	user411@gmail.com	test123	user411
412	user412@gmail.com	test123	user412
413	user413@gmail.com	test123	user413
414	user414@gmail.com	test123	user414
415	user415@gmail.com	test123	user415
416	user416@gmail.com	test123	user416
417	user417@gmail.com	test123	user417
418	user418@gmail.com	test123	user418
419	user419@gmail.com	test123	user419
420	user420@gmail.com	test123	user420
421	user421@gmail.com	test123	user421
422	user422@gmail.com	test123	user422
423	user423@gmail.com	test123	user423
424	user424@gmail.com	test123	user424
425	user425@gmail.com	test123	user425
426	user426@gmail.com	test123	user426
427	user427@gmail.com	test123	user427
428	user428@gmail.com	test123	user428
429	user429@gmail.com	test123	user429
430	user430@gmail.com	test123	user430
431	user431@gmail.com	test123	user431
432	user432@gmail.com	test123	user432
433	user433@gmail.com	test123	user433
434	user434@gmail.com	test123	user434
435	user435@gmail.com	test123	user435
436	user436@gmail.com	test123	user436
437	user437@gmail.com	test123	user437
438	user438@gmail.com	test123	user438
439	user439@gmail.com	test123	user439
440	user440@gmail.com	test123	user440
441	user441@gmail.com	test123	user441
442	user442@gmail.com	test123	user442
443	user443@gmail.com	test123	user443
444	user444@gmail.com	test123	user444
445	user445@gmail.com	test123	user445
446	user446@gmail.com	test123	user446
447	user447@gmail.com	test123	user447
448	user448@gmail.com	test123	user448
449	user449@gmail.com	test123	user449
450	user450@gmail.com	test123	user450
451	user451@gmail.com	test123	user451
452	user452@gmail.com	test123	user452
453	user453@gmail.com	test123	user453
454	user454@gmail.com	test123	user454
455	user455@gmail.com	test123	user455
456	user456@gmail.com	test123	user456
457	user457@gmail.com	test123	user457
458	user458@gmail.com	test123	user458
459	user459@gmail.com	test123	user459
460	user460@gmail.com	test123	user460
461	user461@gmail.com	test123	user461
462	user462@gmail.com	test123	user462
463	user463@gmail.com	test123	user463
464	user464@gmail.com	test123	user464
465	user465@gmail.com	test123	user465
466	user466@gmail.com	test123	user466
467	user467@gmail.com	test123	user467
468	user468@gmail.com	test123	user468
469	user469@gmail.com	test123	user469
470	user470@gmail.com	test123	user470
471	user471@gmail.com	test123	user471
472	user472@gmail.com	test123	user472
473	user473@gmail.com	test123	user473
474	user474@gmail.com	test123	user474
475	user475@gmail.com	test123	user475
476	user476@gmail.com	test123	user476
477	user477@gmail.com	test123	user477
478	user478@gmail.com	test123	user478
479	user479@gmail.com	test123	user479
480	user480@gmail.com	test123	user480
481	user481@gmail.com	test123	user481
482	user482@gmail.com	test123	user482
483	user483@gmail.com	test123	user483
484	user484@gmail.com	test123	user484
485	user485@gmail.com	test123	user485
486	user486@gmail.com	test123	user486
487	user487@gmail.com	test123	user487
488	user488@gmail.com	test123	user488
489	user489@gmail.com	test123	user489
490	user490@gmail.com	test123	user490
491	user491@gmail.com	test123	user491
492	user492@gmail.com	test123	user492
493	user493@gmail.com	test123	user493
494	user494@gmail.com	test123	user494
495	user495@gmail.com	test123	user495
496	user496@gmail.com	test123	user496
497	user497@gmail.com	test123	user497
498	user498@gmail.com	test123	user498
499	user499@gmail.com	test123	user499
500	user500@gmail.com	test123	user500
501	test3@gmail.com	$2b$10$hE4xgqwVupzAN/SX9ojyC.0RlbqXNpI1rZkpEhf3SzXO3eArK511q	test3
502	test4@gmail.com	$2b$10$rq/58iTOhnFyWI39YCQqQuN5Y7W28HRwNV.iRkn/rZ9pJBOtYLVNm	test4
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 12, true);


--
-- Name: contests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contests_id_seq', 13, true);


--
-- Name: leaderboard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leaderboard_id_seq', 673, true);


--
-- Name: problems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.problems_id_seq', 22, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 5939, true);


--
-- Name: test_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_cases_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 502, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: contest_problems contest_problems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_problems
    ADD CONSTRAINT contest_problems_pkey PRIMARY KEY (contest_id, problem_id);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: leaderboard leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_pkey PRIMARY KEY (id);


--
-- Name: leaderboard leaderboard_username_contest_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_username_contest_id_key UNIQUE (username, contest_id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: test_cases test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: contest_problems contest_problems_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_problems
    ADD CONSTRAINT contest_problems_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: contest_problems contest_problems_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_problems
    ADD CONSTRAINT contest_problems_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: leaderboard leaderboard_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_cases test_cases_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


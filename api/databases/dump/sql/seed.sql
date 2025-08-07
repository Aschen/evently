--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

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

--
-- Data for Name: users; Type: TABLE DATA; Schema: base; Owner: database
--

COPY base.users (id, email, role, created_at, updated_at) FROM stdin;
dd8818c0-8f59-42e9-9008-b40628ff3b97	user@example.com	user	2025-08-07 17:27:19.977524+00	2025-08-07 17:27:19.977524+00
a287398a-0f1f-40b3-91ca-65cbe46e9e6e	admin@example.com	admin	2025-08-07 17:27:20.037382+00	2025-08-07 17:27:20.037382+00
\.


--
-- Data for Name: credentials; Type: TABLE DATA; Schema: base; Owner: database
--

COPY base.credentials (id, user_id, password, type, created_at, updated_at) FROM stdin;
56acafbd-ebf7-46aa-b408-03b7346d0cf5	dd8818c0-8f59-42e9-9008-b40628ff3b97	$2b$10$xfepRbzIRNeSiea3zX/H6uJYCykAj.yePVPUMBCTxzQX84d97XQjK	token	2025-08-07 17:27:19.980836+00	2025-08-07 17:27:19.980836+00
ddfa5dfa-f2a3-47fc-8875-af400b778496	a287398a-0f1f-40b3-91ca-65cbe46e9e6e	$2b$10$Hzk2COv5EUB8fp3ciHVzMeK2qbudEwQ/iIr87LrE1/RdjhQJtCp8K	token	2025-08-07 17:27:20.039036+00	2025-08-07 17:27:20.039036+00
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: base; Owner: database
--

COPY base.events (id, name, date, address, city, country, type, price_amount, price_currency, is_free, description, image_url, created_at, updated_at) FROM stdin;
d82391db-1bdc-4387-ad61-7fa26fa855e6	Tech Conference San Francisco 2026	2026-03-15 09:00:00+00	123 Tech Street	San Francisco	USA	conference	299.99	USD	f	Join industry leaders for the latest in technology trends and innovation.	https://example.com/tech-conference.jpg	2025-08-07 17:27:20.131337+00	2025-08-07 17:27:20.131337+00
f2e3e4ac-447b-4e0b-844f-e431780cce22	Jazz Festival New York	2026-06-20 19:00:00+00	456 Music Avenue	New York	USA	festival	75.50	USD	f	Experience the best jazz musicians from around the world.	https://example.com/jazz-festival.jpg	2025-08-07 17:27:20.138619+00	2025-08-07 17:27:20.138619+00
8917b54a-f736-4665-96f1-4925f4601d6b	Modern Art Exhibition	2026-04-10 10:00:00+00	789 Gallery Road	Los Angeles	USA	exhibition	25.00	USD	f	Discover contemporary artists and their groundbreaking works.	\N	2025-08-07 17:27:20.144055+00	2025-08-07 17:27:20.144055+00
eec699fa-a697-4397-b7a2-df12ee6a181e	Lakers vs Warriors	2026-02-28 20:00:00+00	1111 Arena Boulevard	Los Angeles	USA	sport	150.00	USD	f	Epic basketball showdown between two legendary teams.	https://example.com/basketball-game.jpg	2025-08-07 17:27:20.150127+00	2025-08-07 17:27:20.150127+00
cbdcb43d-2fb7-48ad-9baf-f7119a4b41df	Rock Concert Chicago	2026-05-05 21:00:00+00	555 Concert Hall Street	Chicago	USA	concert	89.99	USD	f	An unforgettable night of rock music with top bands.	\N	2025-08-07 17:27:20.156009+00	2025-08-07 17:27:20.156009+00
d3204057-4696-46df-8ee0-b006ebe74057	Community Food Festival	2026-07-04 12:00:00+00	321 Park Avenue	Austin	USA	festival	0.00	USD	t	Free community event celebrating local food and culture.	\N	2025-08-07 17:27:20.160777+00	2025-08-07 17:27:20.160777+00
1cc20ca4-5931-4a18-8285-41c5c12691d7	Startup Networking Event	2026-04-25 18:00:00+00	999 Innovation Drive	Seattle	USA	other	45.00	USD	f	Connect with entrepreneurs and investors in the startup ecosystem.	\N	2025-08-07 17:27:20.16585+00	2025-08-07 17:27:20.16585+00
ca19df08-0eba-4632-869f-b56631fd6c80	Photography Workshop	2026-08-12 14:00:00+00	777 Creative Plaza	Denver	USA	other	120.00	USD	f	Learn advanced photography techniques from professional photographers.	https://example.com/photography-workshop.jpg	2025-08-07 17:27:20.171167+00	2025-08-07 17:27:20.171167+00
\.


--
-- PostgreSQL database dump complete
--


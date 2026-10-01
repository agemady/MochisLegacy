# Runbook: gaggle walks (sign-ups, check-in, roster)

Short, plain instructions for running walks. Database setup is in [supabase/README.md](../../supabase/README.md); deploying the site is in [DEPLOY.md](../DEPLOY.md).

## How it works in one paragraph

There are no accounts or passwords. Every owner gets a **personal link** (`…/schedule#k=…`) that opens their page: their dogs, upcoming walks, and a button per dog to save a spot or give it up. Founders get an **admin link** (`…/checkin#k=…`) that opens the founders' tools. Anyone can see the walk calendar at `/schedule`; only people with a link can sign a dog up.

## Before a walk

1. **Walks tab → New walk** (or edit the draft): date, start and end time (Mountain Time), meeting spot, capacity, and a note owners will see ("Bring a leash, water, and poop bags."). Owners can't see a walk until you press **Publish**.
2. **Gaggle tab**: make sure every owner and dog who should walk is listed. **Add owner** takes a name, phone/email, and the dog's name.
3. Send each owner their link: **Text link** (opens your phone's messages with the link filled in) or **Email link**. **Copy link** works for anything else.
4. Owners open the link, pick their dog, tick the waiver box, and they're in. When the walk is full, new sign-ups join the **waitlist**; if someone gives up a spot, the next dog on the waitlist moves up automatically.

Rules the site enforces for you: the waiver box for every walk, the capacity, one walk per dog per day, and sign-ups close when the walk starts.

## New people from the landing page

**Interest tab** lists the "I have a dog", volunteer and pledge forms. For a dog you'd like on the roster, press **Add to gaggle** — that creates the owner and the dog, and shows their link buttons right away so you can send it. Use **Mark contacted** / **Archive** to keep the list tidy. (Meet the dog first: the roster is for vetted, friendly, vaccinated dogs.)

## Walk day (`/checkin` on a phone)

- Pick the walk at the top (today's walk is picked for you). The counters show who's here, confirmed, waitlisted and out.
- **Check in** each dog as they arrive. Tapped the wrong one? **Undo**.
- **No waiver** badge (a dog a founder added by hand): get the paper waiver signed, then tap **Paper waiver signed**.
- A dog seems off, tired, or too hot? **Opt out** — no questions, no guilt. Opted out by mistake? **Restore** puts them back in their old place.
- A roster dog who forgot to sign up: **Add a roster dog to this walk** at the bottom.
- **A dog that isn't on the roster:** be kind and honest — they're welcome to come say hi without walking today, and they can apply on the landing page. Don't add new dogs at the park.

Two founders can check in at the same time; the list refreshes itself every 30 seconds.

## After the walk

Nothing to do: check-ins and opt-outs are already saved. Set the walk to **done** in the Walks tab if you want it off the list.

## If something goes wrong

- **"This link isn't valid"** — the person has an old or mistyped link. Gaggle tab → **New link**, and send it again.
- **A link was forwarded or a phone was lost** — Gaggle tab → **New link** for that person. The old link stops working immediately.
- **Site says sign-ups are offline** — the Supabase env vars are missing from the deploy ([DEPLOY.md](../DEPLOY.md)).

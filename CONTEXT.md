# Mochi's Legacy

A Boulder community-first therapy-dog organization in memory of Mochi, a golden retriever. This glossary is the ubiquitous language for the public site and the ops model behind it.

## Organization

**Mochi's Legacy**:
The organization that gathers vetted dog+handler pairs and brings them to the Boulder community.
_Avoid_: hospital therapy program, canine-cancer charity

**Mochi**:
The golden retriever whose memory the organization is named for. She. Cancer is origin-story only.
_Avoid_: mascot, brand dog currently on the roster

**Track A**:
Open community events. Friendly, vaccinated, well-handled dogs. Certification is not required.
_Avoid_: informal track, meetup-only

**Track B**:
Scheduled visits to facilities that require a registry-certified Team. Clinical ceiling is senior living / nursing home.
_Avoid_: hospital visits, healthcare program

**Track C**:
Paid "come to the dogs" experience programming. Research item, not a current product.
_Avoid_: daycare, boarding

## People and animals

**Person**:
Any human we keep a record for: owner, handler, volunteer, facility contact, donor, attendee, or board. One row, role tags.
_Avoid_: user, account, contact (as a separate entity)

**Dog**:
An animal on the roster. The unit of health, safety, and care. Identified by a code because call names collide.
_Avoid_: pet, animal (as the roster noun)

**Team**:
One Dog paired with one Handler. The unit of certification and Track B visits.
_Avoid_: pair used as a synonym without the certification meaning

**Handler**:
The Person attached 1:1 to a Dog during an Event or Visit. May differ from the Dog's owner.
_Avoid_: owner (when you mean the person working the dog)

## Activity

**Event**:
A Track A public gathering. Venue is free text until a Venue entity exists.
_Avoid_: visit (that's Track B)

**Gaggle walk**:
A Track A community walk for roster dogs (any tier). Owners sign up per walk; capacity, waitlist and one-walk-a-day are enforced. Stored in `mochi_walks` / `mochi_walk_rsvps`.
_Avoid_: event (when you mean a walk with RSVPs), class

**Personal link**:
The private URL that identifies a Person to the scheduler (`/schedule#k=…`; founders `/checkin#k=…`). There are no accounts or passwords; a leaked link is replaced, not reset.
_Avoid_: login, account, magic link

**Visit**:
One Team engagement at a Facility. The unit of impact every grant will ask for.
_Avoid_: event, appointment

**Facility**:
A Track B site (senior living, school, library, university). Hospitals and hospice are out of scope.
_Avoid_: hospital, clinic, partner (the standing agreement is a Partnership)

**Attendance**:
A Person at an Event, including signup, waiver, and photo consent.
_Avoid_: registration, RSVP (as the stored noun)

**Partnership**:
A standing agreement with a Facility, with named coordinators and a cadence.
_Avoid_: contract (unless a lawyer is in the room)

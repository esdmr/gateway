CREATE TABLE IF NOT EXISTS messages (
	directory Integer NOT NULL DEFAULT 0,
	author Text NOT NULL,
	remote_address Text NOT NULL,
	user_agent Text NOT NULL,
	body Text NOT NULL,
	privacy Integer NOT NULL DEFAULT 0,
	is_redacted Integer NOT NULL DEFAULT 0,
	created_at Integer NOT NULL DEFAULT (unixepoch()),
	modified_at Integer NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS wanted (
	name Integer NOT NULL,
	value Text NOT NULL,
	behavior Integer NOT NULL DEFAULT 0,
	trigger_count Integer NOT NULL DEFAULT 0,
	created_at Integer NOT NULL DEFAULT (unixepoch()),
	modified_at Integer NOT NULL DEFAULT (unixepoch()),
	PRIMARY KEY (name, value)
) STRICT;

PRAGMA optimize=0x10002;

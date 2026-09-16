"""What language a campaign's arrivals start in.

Lives in core rather than in either route module because both need it: the
admin layer to offer and store a choice, the WhatsApp flow to act on it. Put in
one of those and the other has to import it, which is how a circular import
starts.
"""

# Arrivals from an ad start here unless somebody chooses otherwise. Hindi
# because it is much the largest audience; a campaign aimed at another language
# gets set explicitly, and the admin table shows which campaigns are still on
# the default.
DEFAULT_CAMPAIGN_LANGUAGE = "hi"

CAMPAIGN_LANGS = ("en", "hi", "mr", "te", "ta", "kn")

# Not a campaign: someone who messaged the number directly. Nothing about them
# says which language they want, so they are asked.
NO_CAMPAIGN = "organic"

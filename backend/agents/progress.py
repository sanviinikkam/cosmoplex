"""
Builds the Teacher agent's per-learner knowledge context from admin-uploaded
module content docs + the learner's actual progress — so the Teacher only
answers using material the learner has actually been taught, and redirects
(rather than answers) questions about material they haven't reached yet.

Both channels (WhatsApp, web) feed this the same shape of data:
  ordered_lessons: [{"video_id", "title", "module_id", "module_title", "content_doc"}, ...]
                    in course order (module -> section -> video).
  is_completed: Callable[[lesson_dict], bool]

A module is classified independently of the others (no assumption that
completion is sequential — web lets a learner move within an unlocked level
in any order):
  - ALL its lessons completed  -> its content doc is included in full.
  - SOME completed             -> its content doc is included, with an
    explicit instruction listing exactly which lesson titles are done vs not,
    so the model doesn't leak ahead within that module's own document.
  - NONE completed             -> nothing from it is included; its lessons
    are only listed (by title) in not_yet_covered for redirects.
"""
from collections import OrderedDict


def ordered_lessons_from_course(course) -> list[dict]:
    """Flatten an already-loaded Course ORM object (modules -> sections ->
    videos, each relationship eager-loaded) into the flat shape build_teacher_context expects."""
    out = []
    for module in course.modules:
        for section in module.sections:
            for video in section.videos:
                out.append({
                    "video_id": video.id,
                    "title": video.title,
                    "module_id": module.id,
                    "module_title": module.title,
                    "content_doc": module.content_doc,
                })
    return out


def build_teacher_context(ordered_lessons: list[dict], is_completed) -> dict:
    """Returns {"knowledge_text": str, "not_yet_covered": list[str], "has_any_progress": bool}."""
    modules: "OrderedDict[str, dict]" = OrderedDict()
    for lesson in ordered_lessons:
        mid = lesson["module_id"]
        if mid not in modules:
            modules[mid] = {"title": lesson["module_title"], "content_doc": lesson["content_doc"], "lessons": []}
        modules[mid]["lessons"].append(lesson)

    knowledge_parts: list[str] = []
    not_yet_covered: list[str] = []
    has_any_progress = False

    for mod in modules.values():
        lessons = mod["lessons"]
        if not lessons:
            continue
        done = [l for l in lessons if is_completed(l)]
        not_done = [l for l in lessons if not is_completed(l)]
        doc = (mod["content_doc"] or "").strip()

        if len(done) == len(lessons):
            has_any_progress = True
            if doc:
                knowledge_parts.append(
                    "=== Module: {title} (learner has FULLY completed this module) ===\n{doc}".format(
                        title=mod["title"], doc=doc)
                )
        elif done:
            has_any_progress = True
            done_titles = ", ".join(l["title"] for l in done)
            not_done_titles = ", ".join(l["title"] for l in not_done)
            if doc:
                note = (
                    "NOTE: within this module, the learner has ONLY completed: {done}. "
                    "They have NOT yet reached: {pending}. This document may describe the "
                    "whole module — do not use or reveal anything in it that belongs to the "
                    "not-yet-reached lessons listed above."
                ).format(done=done_titles, pending=not_done_titles)
                knowledge_parts.append(
                    "=== Module: {title} (partially completed) ===\n{doc}\n\n{note}".format(
                        title=mod["title"], doc=doc, note=note)
                )
            for l in not_done:
                not_yet_covered.append("{module} — {lesson}".format(module=mod["title"], lesson=l["title"]))
        else:
            for l in not_done:
                not_yet_covered.append("{module} — {lesson}".format(module=mod["title"], lesson=l["title"]))

    return {
        "knowledge_text": "\n\n".join(knowledge_parts).strip(),
        "not_yet_covered": not_yet_covered[:30],   # cap — this is a redirect hint list, not meant to be exhaustive in the prompt
        "has_any_progress": has_any_progress,
    }

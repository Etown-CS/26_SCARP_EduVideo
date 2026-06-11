import json

# Process segments to give to API
def format_topic_for_prompt(topic):
    lines = []
    for sub in topic["subsegments"]:
        lines.append(f"  id: {sub['id']}, type: {sub['type']}, content: {sub['content']}")
    return "\n".join(lines)

# Load the file (file path has to be adjusted)
with open("output_sample/cs322_mst_9/cs322_mst_9.json", "r") as f:
    data = json.load(f)

# Summary to check what's inside
print(f"Topic: {data['topic']}")
print(f"Number of topics: {len(data['segments'])}")
print()

for topic in data['segments']:
    print(f"  [{topic['order']}] {topic['content']}  ({len(topic['subsegments'])} subsegments)")

# topic_1 = data["segments"][0]
# print(f"Topic: {topic_1['content']}")
# print()
# print(format_topic_for_prompt(topic_1))
type Sample = {
  alias: string;
  channel: string;
  title: string;
  body: string;
  reply?: { role: string; text: string };
};

const samples: Sample[] = [
  {
    alias: "Anonymous Willow",
    channel: "Career & Purpose",
    title: "I keep wondering if I chose the wrong career",
    body: "Five years in, I’m good at my job but it no longer feels like mine. I don’t know whether to stay or start over.",
    reply: {
      role: "Executive coach",
      text: "Feeling capable and unfulfilled at the same time is common. It may help to separate what you’d keep from what you’d change.",
    },
  },
  {
    alias: "Anonymous Harbor",
    channel: "Relationships",
    title: "How do I set boundaries with family without guilt?",
    body: "Every visit ends with me feeling drained, but saying no feels like betrayal.",
  },
  {
    alias: "Anonymous Finch",
    channel: "Grief & Transitions",
    title: "A year after moving abroad and still feeling unsettled",
    body: "Everything looks fine from the outside. Inside, I miss a version of life that no longer exists.",
    reply: {
      role: "Counselor",
      text: "Transitions often take longer than we expect. Small routines can slowly make a new place feel like yours.",
    },
  },
  {
    alias: "Anonymous Birch",
    channel: "Identity",
    title: "Who am I outside of my job title?",
    body: "I realised most of how I describe myself is tied to work. I’d like to find the rest.",
  },
  {
    alias: "Anonymous Meadow",
    channel: "Emotional Wellbeing",
    title: "I can’t switch my mind off at night",
    body: "By evening my thoughts speed up and sleep gets pushed later and later.",
    reply: {
      role: "Psychologist",
      text: "A short wind-down routine and writing tomorrow’s worries down earlier in the evening can sometimes quiet the loop.",
    },
  },
];

function PreviewCard({ post, hidden = false }: { post: Sample; hidden?: boolean }) {
  return (
    <div className="feed-preview-item" aria-hidden={hidden || undefined}>
      <article className="surface-card feed-preview-card">
        <div className="feed-preview-meta">
          <span className="feed-preview-avatar" aria-hidden="true">
            {post.alias.split(" ").at(-1)?.[0] ?? "A"}
          </span>
          <div>
            <b>{post.alias}</b>
            <small>{post.channel}</small>
          </div>
        </div>
        <h3>{post.title}</h3>
        <p>{post.body}</p>
        {post.reply && (
          <div className="feed-preview-reply">
            <span>{post.reply.role}</span>
            <p>{post.reply.text}</p>
          </div>
        )}
      </article>
    </div>
  );
}

export default function FeedPreview() {
  return (
    <div className="feed-preview-wrap">
      <div className="feed-preview" role="region" aria-label="Sample reflections">
        {/* The list is rendered twice so the loop restarts seamlessly */}
        <div className="feed-preview-track">
          {samples.map((post) => (
            <PreviewCard key={`a-${post.title}`} post={post} />
          ))}
          {samples.map((post) => (
            <PreviewCard key={`b-${post.title}`} post={post} hidden />
          ))}
        </div>
      </div>
      
    </div>
  );
}
import React from 'react';
import { groq } from 'next-sanity';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';

// --- Assuming you have these configured ---
import { client } from '@/sanity/lib/client'; // <<< VERIFY THIS IMPORT PATH
import imageUrlBuilder from '@sanity/image-url'; // For Images

// --- CORRECTED STYLE IMPORT ---
import './style.scss'; // <<< Using standard SCSS import

// Helper to generate Image URLs
const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  if (!source?.asset?._ref) {
     return undefined;
  }
  return builder.image(source);
}

// --- Define Types (based on your schema) ---
interface BlogPost {
  _id: string;
  title: string;
  publishedAt: string;
  mainImage: {
    asset: {
      _ref: string;
      _type: string;
    };
    alt: string;
  };
  body: any[]; // Portable Text content
}

// --- Fetch Data Function ---
async function getPostData(slug: string): Promise<BlogPost | null> {
  const query = groq`*[_type == "blogPost" && slug.current == $slug][0]{
    _id,
    title,
    publishedAt,
    mainImage {
      asset,
      alt
    },
    body
  }`;

  const post = await client.fetch(query, { slug });
  return post;
}

// --- Custom Components for Portable Text (Using String Class Names) ---
const myPortableTextComponents = {
  types: {
    image: ({ value }: { value: any }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        // Use String class name
        <figure className="rich-text-image">
          <img
            src={urlFor(value).width(800).auto('format').url()}
            alt={value.alt || 'Blog post image'}
            loading="lazy"
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      );
    },
  },
  block: {
    // Use String class names
    h2: ({ children }: { children: React.ReactNode }) => <h2 className="rich-text-h2">{children}</h2>,
    h3: ({ children }: { children: React.ReactNode }) => <h3 className="rich-text-h3">{children}</h3>,
    blockquote: ({ children }: { children: React.ReactNode }) => <blockquote className="rich-text-blockquote">{children}</blockquote>,
    normal: ({ children }: { children: React.ReactNode }) => {
       if (React.Children.count(children) === 1 && (children as any[])[0] === '') {
         return null;
       }
       return <p className="rich-text-p">{children}</p>;
    }
  },
  marks: {
    link: ({ children, value }: { children: React.ReactNode; value?: { href?: string; blank?: boolean } }) => {
      const rel = value?.blank ? 'noopener noreferrer' : undefined;
      const target = value?.blank ? '_blank' : undefined;
      return (
        <a href={value?.href} target={target} rel={rel} className="rich-text-link">
          {children}
        </a>
      );
    },
    strong: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
    em: ({ children }: { children: React.ReactNode }) => <em>{children}</em>,
    underline: ({ children }: { children: React.ReactNode }) => <span style={{textDecoration: 'underline'}}>{children}</span>,
  },
   list: {
    // Use String class names
    bullet: ({ children }: { children: React.ReactNode }) => <ul className="rich-text-ul">{children}</ul>,
    number: ({ children }: { children: React.ReactNode }) => <ol className="rich-text-ol">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    number: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  },
};

// --- The Page Component ---
interface PageProps {
  params: {
    slug: string;
  };
}

const Page: React.FC<PageProps> = async ({ params }) => {
  const post = await getPostData(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : 'Date not available';

  const mainImageUrl = urlFor(post.mainImage)?.url();

  return (
    // Use String class names
    <div> {/* Outer wrapper */}
        <div className="blog-section-container flex items-center justify-center margin-bottom">
            <div className="blog-section container"> {/* Assuming 'container' is a global class */}
                <div className="image-container">
                   {mainImageUrl && (
                       <img src={mainImageUrl} alt={post.mainImage.alt || post.title} />
                   )}
                </div>

                <div className="content-container">
                    <p className="blog-date">
                        Date Published : {formattedDate}
                    </p>

                    <h1 className="blog-title">
                        {post.title}
                    </h1>

                    <div className="rich-text-container">
                        {post.body && (
                            <PortableText value={post.body} components={myPortableTextComponents} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Page;
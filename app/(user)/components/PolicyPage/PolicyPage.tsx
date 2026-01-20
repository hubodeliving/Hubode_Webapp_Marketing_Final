import React from 'react';
import './policy-page.scss';

type PolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; title?: string; items: string[] };

export interface PolicySection {
  id: string;
  title: string;
  description?: string;
  blocks: PolicyBlock[];
}

interface PolicyPageProps {
  title: string;
  lastUpdated: string;
  intro?: string[];
  sections: PolicySection[];
}

const PolicyPage: React.FC<PolicyPageProps> = ({ title, lastUpdated, intro = [], sections }) => {
  const renderBlock = (block: PolicyBlock, index: number) => {
    if (block.type === 'paragraph') {
      return (
        <p key={`paragraph-${index}`} className="policy-block-text">
          {block.text}
        </p>
      );
    }

    return (
      <div key={`list-${index}`} className="policy-block-list">
        {block.title && <p className="policy-block-list__title">{block.title}</p>}
        <ul>
          {block.items.map((item, itemIndex) => (
            <li key={`list-${index}-item-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section className="policy-page-wrapper">
      <div className="policy-hero-container flex items-center justify-center margin-bottom">
        <div className="policy-hero container">
          <h1>{title}</h1>
          <p className="policy-last-updated">Last updated: {lastUpdated}</p>
          <div className="policy-intro">
            {intro.map((paragraph, index) => (
              <p key={`intro-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="policy-content container margin-bottom">
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="policy-section">
            <div className="policy-section__header">
              <div className="policy-section__badge">{section.id}</div>
              <h2>{section.title}</h2>
            </div>
            {section.description && <p className="policy-section__description">{section.description}</p>}
            <div className="policy-section__body">
              {section.blocks.map((block, index) => renderBlock(block, index))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PolicyPage;

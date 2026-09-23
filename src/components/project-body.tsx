import Image from "next/image";

import { buildProjectBodyBlocks } from "@/lib/project-body";
import type { ProjectBodyImage } from "@/lib/types";
import { isAllowedImageUrl, isDemoImageUrl } from "@/lib/validation";

import styles from "./project-body.module.css";

type ProjectBodyProps = {
  description: string;
  images?: ProjectBodyImage[];
  allowDemoImages?: boolean;
};

export function ProjectBody({
  description,
  images = [],
  allowDemoImages = false,
}: ProjectBodyProps) {
  const blocks = buildProjectBodyBlocks(description, images);

  return (
    <div className={styles.body}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p className={styles.paragraph} key={`paragraph-${block.paragraph}`}>{block.text}</p>;
        }

        const { image } = block;
        if (!isAllowedImageUrl(image.url) && !(allowDemoImages && isDemoImageUrl(image.url))) {
          return null;
        }

        return (
          <figure className={styles.figure} data-body-image={image.id} key={`image-${image.id}-${index}`}>
            <Image
              className={styles.image}
              src={image.url}
              alt={image.alt}
              width={1600}
              height={1200}
              sizes="(max-width: 768px) 100vw, 720px"
              unoptimized
            />
            {image.caption && <figcaption className={styles.caption}>{image.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

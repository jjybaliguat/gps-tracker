import Image from 'next/image';
import React from 'react';

const OverviewCard = ({
  title,
  image,
  total,
}: {
  title: string;
  image: string;
  total: number | null;
}) => {
  return (
    <div className="rounded-2xl bg-muted/50 dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary">
            {title}
          </h2>
          <h1 className="text-4xl font-semibold text-gray-800 dark:text-white mt-1">
            {total && total.toLocaleString()}
          </h1>
        </div>
        <div className="relative h-16 w-16">
          <Image
            src={image}
            alt={`${title} icon`}
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;

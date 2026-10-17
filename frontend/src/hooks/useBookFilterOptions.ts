import { useEffect, useState } from 'react';
import { getCategories } from '../services/categoryService';
import { getPublishers } from '../services/publisherService';
import { getPublicationYears } from '../services/bookService';
import type { CategoryData } from '../types/category';
import type { PublisherData } from '../types/publisher';

export const useBookFilterOptions = () => {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [publishers, setPublishers] = useState<PublisherData[]>([]);
    const [error, setError] = useState('');
    const [publicationYears, setPublicationYears] = useState<number[]>([]);
    useEffect(() => {
        let active = true;
        Promise.all([getCategories(), getPublishers(), getPublicationYears()]).then(([categoryList, publisherList, years]) => {
            if (active) { setCategories(categoryList); setPublishers(publisherList); setPublicationYears(years); }
        }).catch(reason => { if (active) setError(reason.message); });
        return () => { active = false; };
    }, []);
    return { categories, publishers, publicationYears, error };
};

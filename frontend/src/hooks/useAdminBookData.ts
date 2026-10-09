import { useCallback, useEffect, useState } from 'react';
import { createBook, deleteBook, getBooks, updateBook } from '../services/bookService';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/categoryService';
import { createPublisher, deletePublisher, getPublishers, updatePublisher } from '../services/publisherService';
import type { AdminBookData, SaveBookRequest } from '../types/book';
import type { CategoryData } from '../types/category';
import type { PublisherData } from '../types/publisher';


export const useAdminBookData = () => {
    const [books, setBooks] = useState<AdminBookData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [publishers, setPublishers] = useState<PublisherData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [bookResult, categoryResult, publisherResult] = await Promise.all([
                getBooks({ pageNumber: 1, pageSize: 100 }),
                getCategories(),
                getPublishers(),
            ]);
            const allBooks = [...bookResult.items];
            for (let pageNumber = 2; pageNumber <= bookResult.totalPages; pageNumber++) {
                const nextPage = await getBooks({ pageNumber, pageSize: 100 });
                allBooks.push(...nextPage.items);
            }
            setBooks(allBooks);
            setCategories(categoryResult);
            setPublishers(publisherResult);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thể tải dữ liệu quản lý sách.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(loadData);
    }, [loadData]);

    const saveBook = async (id: number | null, data: SaveBookRequest) => {
        const result = id ? await updateBook(id, data) : await createBook(data);
        setBooks((current) => id
            ? current.map((book) => book.id === id ? result : book)
            : [result, ...current]);
    };

    const removeBook = async (id: number) => {
        await deleteBook(id);
        setBooks((current) => current.filter((book) => book.id !== id));
    };

    const saveCategory = async (id: number | null, data: { name: string; parentId: number | null; description: string | null }) => {
        const result = id ? await updateCategory(id, data) : await createCategory(data);
        setCategories((current) => id
            ? current.map((category) => category.id === id ? result : category)
            : [result, ...current]);
    };

    const removeCategory = async (id: number) => {
        await deleteCategory(id);
        setCategories((current) => current.filter((category) => category.id !== id));
    };

    const savePublisher = async (id: number | null, data: { name: string; address: string | null; phone: string | null; email: string | null; description: string | null }) => {
        const result = id ? await updatePublisher(id, data) : await createPublisher(data);
        setPublishers((current) => id
            ? current.map((publisher) => publisher.id === id ? result : publisher)
            : [result, ...current]);
    };

    const removePublisher = async (id: number) => {
        await deletePublisher(id);
        setPublishers((current) => current.filter((publisher) => publisher.id !== id));
    };

    return {
        books,
        categories,
        publishers,
        isLoading,
        error,
        loadData,
        saveBook,
        removeBook,
        saveCategory,
        removeCategory,
        savePublisher,
        removePublisher,
    };
};

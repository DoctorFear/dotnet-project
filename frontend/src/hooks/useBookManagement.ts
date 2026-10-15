import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createBook, deleteBook, getBooks, getBookById, updateBook, updateBookStatus } from '../services/bookService';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/categoryService';
import { createPublisher, deletePublisher, getPublishers, updatePublisher } from '../services/publisherService';
import type { AdminBookData, AdminBookStatus, SaveBookRequest } from '../types/book';
import type { CategoryData } from '../types/category';
import type { PublisherData } from '../types/publisher';
import type { AdminBookTab, DraftValue, DraftFormState, ConfirmState } from '../types/adminCatalog';
import type { ToastMessage } from '../components/common/ToastNotification';

const useAdminBookData = () => {
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
        await refreshCatalogCounts();
    };

    const refreshCatalogCounts = async () => {
        try {
            const [categoryList, publisherList] = await Promise.all([getCategories(), getPublishers()]);
            setCategories(categoryList); setPublishers(publisherList);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể làm mới số lượng sách.'); }
    };

    const loadBookDetail = (id: number) => getBookById(id);
    const changeBookStatus = async (id: number, status: AdminBookData['status']) => {
        await updateBookStatus(id, status);
        setBooks(items => items.map(book => book.id === id ? { ...book, status } : book));
    };

    const removeBook = async (id: number) => {
        await deleteBook(id);
        setBooks((current) => current.filter((book) => book.id !== id));
        await refreshCatalogCounts();
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
        loadBookDetail,
        changeBookStatus,
        removeBook,
        saveCategory,
        removeCategory,
        savePublisher,
        removePublisher,
    };
};

export const useBookManagement = () => {
    const [isSaving, setIsSaving] = useState(false);
    const saving = useRef(false);
    const [uploadCount, setUploadCount] = useState(0);
    const onUploadBusyChange = (busy: boolean) => setUploadCount(count => Math.max(0, count + (busy ? 1 : -1)));
    const {
        books,
        categories,
        publishers,
        isLoading,
        error,
        saveBook: saveBookToServer,
        removeBook,
        saveCategory: saveCategoryToServer,
        removeCategory,
        savePublisher: savePublisherToServer,
        removePublisher,
        loadData,
        loadBookDetail,
        changeBookStatus,
    } = useAdminBookData();
    const [activeTab, setActiveTab] = useState<AdminBookTab>('books');
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [publisherFilter, setPublisherFilter] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [modalKind, setModalKind] = useState<AdminBookTab | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<DraftFormState>({});
    const [formWarn, setFormWarn] = useState('');
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Lắng nghe click ngoài màn hình để tự đóng dropdown thể loại
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const newToast: ToastMessage = { id: Date.now().toString(), message, type };
        setToasts((prev) => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const categoryNameMap = useMemo(
        () => new Map(categories.map((cat) => [cat.id, cat.name])),
        [categories]
    );

    const publisherNameMap = useMemo(
        () => new Map(publishers.map((pub) => [pub.id, pub.name])),
        [publishers]
    );

    const stats = useMemo(() => {
        return {
            total: books.length,
            selling: books.filter((b) => b.status === 'selling').length,
            upcoming: books.filter((b) => b.status === 'upcoming').length,
            stopped: books.filter((b) => b.status === 'stopped').length,
        };
    }, [books]);

    // Lọc dữ liệu theo từng Tab
    const filteredItems = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        if (activeTab === 'books') {
            return books.filter((book) => {
                const publisherName = (book.publisherId === null ? book.publisher : publisherNameMap.get(book.publisherId)) || '';
                const categoryNames = book.categoryIds.map((id) => categoryNameMap.get(id) || '').join(' ');
                const matchesText = !q || `${book.title} ${book.author} ${book.isbn} ${publisherName} ${categoryNames}`.toLowerCase().includes(q);
                const matchesStatus = !statusFilter || book.status === statusFilter;
                return matchesText && matchesStatus && (!categoryFilter || book.categoryIds.includes(Number(categoryFilter))) && (!publisherFilter || book.publisherId === Number(publisherFilter)) && (!minPrice || book.physicalPrice >= Number(minPrice)) && (!maxPrice || book.physicalPrice <= Number(maxPrice));
            });
        }

        if (activeTab === 'categories') {
            return categories.filter((cat) => !q || `${cat.name} ${cat.description || ''}`.toLowerCase().includes(q));
        }

        return publishers.filter((pub) => !q || `${pub.name} ${pub.address || ''} ${pub.phone || ''} ${pub.email || ''}`.toLowerCase().includes(q));
    }, [activeTab, books, categories, categoryNameMap, publishers, publisherNameMap, searchText, statusFilter, categoryFilter, publisherFilter, minPrice, maxPrice]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const resetListState = (tab: AdminBookTab) => {
        setActiveTab(tab);
        setSearchText('');
        setStatusFilter('');
        setCategoryFilter(''); setPublisherFilter(''); setMinPrice(''); setMaxPrice('');
        setPage(1);
    };

    const updateDraft = (key: string, value: DraftValue) => {
        setDraft((prev) => {
            const updated = { ...prev, [key]: value };
            if (key === 'isEBookAvailable' && value === false) updated.isRentalAvailable = false;

            return updated;
        });
    };

    // Chọn hoặc bỏ chọn thể loại trong danh sách nhiều lựa chọn.
    const toggleCategorySelection = (categoryId: number) => {
        const currentCategoryIds = (draft.categoryIds as number[]) || [];
        const updatedCategoryIds = currentCategoryIds.includes(categoryId)
            ? currentCategoryIds.filter((id) => id !== categoryId)
            : [...currentCategoryIds, categoryId];

        setDraft((prev) => ({ ...prev, categoryIds: updatedCategoryIds }));
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormWarn('');

        if (activeTab === 'books') {
            setDraft({
                id: `B${String(books.length + 1).padStart(2, '0')}`,
                title: '',
                author: '',
                isbn: '',
                publisherId: publishers[0]?.id || 1,
                categoryIds: [],
                coverImg: '',
                physicalPrice: 0,
                isPhysicalAvailable: true,
                isEBookAvailable: false,
                isRentalAvailable: false,
                eBookPrice: 0,
                weeklyRentalPrice: 0,
                monthlyRentalPrice: 0,
                yearlyRentalPrice: 0,
                stockCount: 0,
                status: 'selling',
            });
        } else if (activeTab === 'categories') {
            setDraft({ name: '', parentId: '', description: '' });
        } else if (activeTab === 'publishers') {
            setDraft({ name: '', address: '', phone: '', email: '', description: '' });
        }

        setModalKind(activeTab);
    };

    const openEditModal = async (kind: AdminBookTab, id: number) => {
        if (kind === 'books') {
            try {
                const book = await loadBookDetail(id);
                // Nạp đầy đủ thể loại và metadata của sách trước khi sửa.
                setDraft({ ...book, galleryImages: book.galleryImages.join('\n') });
                setEditingId(id);
                setFormWarn('');
                setModalKind(kind);
            } catch (reason) { addToast(reason instanceof Error ? reason.message : 'Không thể tải chi tiết sách.', 'error'); }
            return;
        }
        setEditingId(id);
        setFormWarn('');
        setModalKind(kind);

        if (kind === 'categories') {
            const cat = categories.find((item) => item.id === id);
            if (!cat) return;
            setDraft({ name: cat.name, parentId: cat.parentId || '', description: cat.description || '' });
        } else if (kind === 'publishers') {
            const pub = publishers.find((item) => item.id === id);
            if (!pub) return;
            setDraft({ name: pub.name, address: pub.address || '', phone: pub.phone || '', email: pub.email || '', description: pub.description || '' });
        }
    };

    const closeModal = () => {
        setModalKind(null);
        setEditingId(null);
        setFormWarn('');
        setIsCategoryDropdownOpen(false);
    };

    const saveModal = async () => {
        if (saving.current) return;
        saving.current = true;
        setIsSaving(true);
        try {
            if (modalKind === 'books') await saveBook();
            if (modalKind === 'categories') await saveCategory();
            if (modalKind === 'publishers') await savePublisher();
        } finally { saving.current = false; setIsSaving(false); }
    };

    const saveBook = async () => {
        const titleStr = typeof draft.title === 'string' ? draft.title.trim() : '';
        const isbnStr = typeof draft.isbn === 'string' ? draft.isbn.trim() : '';
        const categoryIds = (draft.categoryIds as number[]) || [];

        if (!titleStr || !isbnStr || !draft.publisherId || categoryIds.length === 0) {
            setFormWarn('Vui lòng nhập Tên sách, ISBN, chọn NXB và chọn ít nhất 1 Thể loại.');
            return;
        }

        const duplicatedIsbn = books.some((b) => b.isbn === isbnStr && b.id !== editingId);
        if (duplicatedIsbn) {
            setFormWarn('Mã ISBN đã tồn tại trong hệ thống.');
            return;
        }

        const eBookPriceVal = Number(draft.eBookPrice || 0);

        const request = {
            title: titleStr,
            author: (typeof draft.author === 'string' && draft.author.trim()) || '',
            isbn: isbnStr,
            publisherId: Number(draft.publisherId),
            categoryIds,
            coverImg: (typeof draft.coverImg === 'string' && draft.coverImg.trim()) || '',
            isPhysicalAvailable: draft.isPhysicalAvailable === true,
            physicalPrice: Number(draft.physicalPrice || 0),
            isEBookAvailable: draft.isEBookAvailable === true,
            eBookPrice: eBookPriceVal,
            isRentalAvailable: draft.isRentalAvailable === true,
            weeklyRentalPrice: Number(draft.weeklyRentalPrice || 0),
            monthlyRentalPrice: Number(draft.monthlyRentalPrice || 0),
            yearlyRentalPrice: Number(draft.yearlyRentalPrice || 0),
            status: draft.status as AdminBookStatus,
            pages: draft.pages ? Number(draft.pages) : null,
            weight: draft.weight ? Number(draft.weight) : null,
            publicationYear: draft.publicationYear ? Number(draft.publicationYear) : null,
            description: (draft.description as string) || null,
            language: (draft.language as string) || null,
            dimensions: (draft.dimensions as string) || null,
            galleryImages: String(draft.galleryImages || '').split('\n').map(url => url.trim()).filter(Boolean),
        };

        try {
            await saveBookToServer(editingId, request);
            closeModal();
            addToast(editingId ? 'Cập nhật thông tin Sách thành công.' : 'Thêm sách mới thành công.', 'success');
        } catch (requestError) {
            setFormWarn(requestError instanceof Error ? requestError.message : 'Không thể lưu thông tin sách.');
        }
    };

    const saveCategory = async () => {
        const name = typeof draft.name === 'string' ? draft.name.trim() : '';
        if (!name) {
            setFormWarn('Tên danh mục không được để trống.');
            return;
        }

        try {
            await saveCategoryToServer(typeof editingId === 'number' ? editingId : null, {
                name,
                parentId: draft.parentId ? Number(draft.parentId) : null,
                description: (draft.description as string) || null,
            });
            closeModal();
            addToast(editingId ? 'Cập nhật danh mục thành công.' : 'Thêm danh mục thể loại thành công.', 'success');
        } catch (requestError) {
            setFormWarn(requestError instanceof Error ? requestError.message : 'Không thể lưu danh mục.');
        }
    };

    const savePublisher = async () => {
        const name = typeof draft.name === 'string' ? draft.name.trim() : '';
        if (!name) {
            setFormWarn('Tên NXB không được để trống.');
            return;
        }

        try {
            await savePublisherToServer(typeof editingId === 'number' ? editingId : null, {
                name,
                address: (draft.address as string) || null,
                phone: (draft.phone as string) || null,
                email: (draft.email as string) || null,
                description: (draft.description as string) || null,
            });
            closeModal();
            addToast(editingId ? 'Cập nhật NXB thành công.' : 'Thêm nhà xuất bản thành công.', 'success');
        } catch (requestError) {
            setFormWarn(requestError instanceof Error ? requestError.message : 'Không thể lưu nhà xuất bản.');
        }
    };

    const confirmDelete = async () => {
        if (!confirmState) return;

        try {
            if (confirmState.kind === 'books') await removeBook(confirmState.id);
            if (confirmState.kind === 'categories') await removeCategory(Number(confirmState.id));
            if (confirmState.kind === 'publishers') await removePublisher(Number(confirmState.id));
            setConfirmState(null);
            addToast(confirmState.kind === 'books' ? 'Xóa Sách thành công.' : confirmState.kind === 'categories' ? 'Xóa thể loại danh mục thành công.' : 'Xóa nhà xuất bản thành công.', 'success');
        } catch (requestError) {
            await loadData();
            setConfirmState(null);
            addToast(requestError instanceof Error ? requestError.message : 'Không thể xóa dữ liệu.', 'error');
        }
    };

    // Tự động hiển thị chuỗi danh sách các thể loại đã được chọn
    const selectedCategoriesText = useMemo(() => {
        const selectedIds = (draft.categoryIds as number[]) || [];
        if (selectedIds.length === 0) return 'Chọn các thể loại...';
        return selectedIds.map((id) => categoryNameMap.get(id)).filter(Boolean).join(', ');
    }, [draft.categoryIds, categoryNameMap]);

    const isEBookDisabled = draft.isEBookAvailable !== true || draft.isRentalAvailable !== true;


    return { uploadCount, onUploadBusyChange, isSaving, books, categories, publishers, isLoading, error, activeTab, searchText, statusFilter, categoryFilter, publisherFilter, minPrice, maxPrice, pageSize, modalKind, editingId, draft, formWarn, confirmState, toasts, isCategoryDropdownOpen, categoryDropdownRef, categoryNameMap, publisherNameMap, stats, currentPage, pageItems, filteredItems, selectedCategoriesText, isEBookDisabled, setSearchText, setStatusFilter, setCategoryFilter, setPublisherFilter, setMinPrice, setMaxPrice, setPage, setPageSize, setConfirmState, setIsCategoryDropdownOpen, resetListState, updateDraft, toggleCategorySelection, openCreateModal, openEditModal, closeModal, saveModal, confirmDelete, removeToast, changeBookStatus, addToast };
};

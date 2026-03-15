import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Autocomplete,
    Button,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { apiFetch } from '../src/utils/api';

// ────────────────────────────────────────────────
// Types (unchanged)
interface Rate {
    irate: number;
    wefDate: string;
}

interface ItemRequest {
    itemCode: number;
    itemName: string;
    itemType: number;
    rate?: Rate;
    
}

interface UpdatePayload extends ItemRequest {
    previousRate?: Rate;
    previousWefDate?: string;
}

// ────────────────────────────────────────────────
// API Base – change to your real URL
//const API_BASE = 'http://your-backend-url/api';

// API Functions (mostly unchanged, just fixed delete URL consistency)
const saveItemMaster = async (payload: ItemRequest): Promise<boolean> => {
    try {
        let res = await apiFetch(`ItemMaster/SaveItemMaster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        res = typeof res === 'string' ? JSON.parse(res) : res;
        console.log("Response from saveItemMaster is:", res);   
        if (res?.statusCode === 1) {
            await Swal.fire({ icon: 'success', title: 'Saved!', text: 'Item Master saved successfully', timer: 2000 });
            return true;
        }
        else {
            await Swal.fire({ icon: 'error', title: 'Error', text: res?.message || 'Failed to save item' });
            return false;
        }
    } catch {
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save item' });
        return false;
    }
};

const getItemMaster = async (itemCode: number): Promise<ItemRequest | null> => {
    try {
        const res = await apiFetch(`ItemMaster/getItemMaster/${itemCode}`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch {
        return null;
    }
};

const updateItemMaster = async (payload: UpdatePayload): Promise<boolean> => {
    try {
        const res = await apiFetch(`ItemMaster/UpdateItemMaster`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        await Swal.fire({ icon: 'success', title: 'Updated!', text: 'Rate updated successfully', timer: 2000 });
        return true;
    } catch {
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update rate' });
        return false;
    }
};

const getAllItemMasters = async () => {
    try {
        const res = await apiFetch(`ItemMaster/getItemMaster`);
        console.log("response of item master is:",res)
        return await res
    } catch {
        return [];
    }
};

const deleteItemMaster = async (itemCode: number): Promise<boolean> => {
    try {
        // Made consistent with other endpoints (assuming same base)
        const res = await apiFetch(`ItemMaster/${itemCode}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Item deleted successfully', timer: 2000 });
        return true;
    } catch {
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete item' });
        return false;
    }
};

// ────────────────────────────────────────────────
const ITEM_TYPES = [
    { label: 'Meal', value: 1 },
    { label: 'Snacks', value: 2 },
];

const getItemTypeLabel = (type: number): string => {
    return type === 1 ? 'Meal' : type === 2 ? 'Snacks' : `Type ${type}`;
};

const ItemMaster = () => {
    // Left Card - New Item / Edit
    const [itemCode, setItemCode] = useState<number | ''>('');
    const [itemName, setItemName] = useState('');
    const [itemType, setItemType] = useState<number | null>(null);
    const [rate, setRate] = useState<number | ''>('');
    const [wefDate, setWefDate] = useState<string>('');

    // Right Card - Rate Update (shows previous + allows new rate)
    const [selectedItem, setSelectedItem] = useState<ItemRequest | null>(null);
    const [newRate, setNewRate] = useState<number | ''>('');
    const [newWefDate, setNewWefDate] = useState<string>('');

    // Table
    const [allItems, setAllItems] = useState<ItemRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadAllItems = async () => {
        let data = await getAllItemMasters();
        data = typeof data === 'string' ? JSON.parse(data) : data; 
        const result = data?.dataFetch?.table|| [];
        console.log("Item master data is:", result);
        setAllItems(result);
    };

    useEffect(() => {
        loadAllItems();
    }, []);

    // When user clicks Edit → fill left form + load right card data
    const handleEdit = async (code: number) => {
        const item = await getItemMaster(code);
        if (!item) {
            Swal.fire({ icon: 'error', title: 'Not found', text: 'Item not found' });
            return;
        }

        setItemCode(item.itemCode);
        setItemName(item.itemName);
        setItemType(item.itemType);
        setRate(item.rate?.irate ?? '');
        setWefDate(item.rate?.wefDate ?? '');

        setSelectedItem(item);       // also updates right card
        setNewRate('');              // reset new rate fields
        setNewWefDate('');
    };

    const filteredItems = allItems.filter(item =>
        item.itemCode.toString().includes(searchTerm) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getItemTypeLabel(item.itemType).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveNewItem = async () => {
        if (!itemCode || !itemName || itemType === null) {
            await Swal.fire({ icon: 'warning', title: 'Missing Fields', text: 'Item Code, Name and Type are required!' });
            return;
        }

        const payload: ItemRequest = {
            itemCode: Number(itemCode),
            itemName,
            itemType,
            rate: rate && wefDate ? { irate: Number(rate), wefDate } : undefined,
        };

        const success = await saveItemMaster(payload);
        if (success) {
            resetLeftForm();
            await loadAllItems();
        }
    };

    const resetLeftForm = () => {
        setItemCode('');
        setItemName('');
        setItemType(null);
        setRate('');
        setWefDate('');
        setSelectedItem(null);
        setNewRate('');
        setNewWefDate('');
    };

    const handleUpdateRate = async () => {
        if (!selectedItem || !newRate || !newWefDate) {
            await Swal.fire({ icon: 'warning', title: 'Missing Fields', text: 'New Rate and New WEF Date are required!' });
            return;
        }

        const payload: UpdatePayload = {
            ...selectedItem,
            rate: { irate: Number(newRate), wefDate: newWefDate },
            previousRate: selectedItem.rate,
            previousWefDate: selectedItem.rate?.wefDate,
        };

        const success = await updateItemMaster(payload);
        if (success) {
            const updated = await getItemMaster(selectedItem.itemCode);
            if (updated) setSelectedItem(updated);
            setNewRate('');
            setNewWefDate('');
            await loadAllItems();
        }
    };

    const handleDelete = async (code: number) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete Item Code ${code}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
        });

        if (confirm.isConfirmed) {
            const success = await deleteItemMaster(code);
            if (success) await loadAllItems();
        }
    };

    // Export functions (unchanged)
    const exportToCSV = () => {
        const headers = ['Item Code', 'Item Name', 'Item Type', 'Rate', 'WEF Date'];
        const rows = allItems.map(item => [
            item.itemCode,
            `"${item.itemName}"`,
            getItemTypeLabel(item.itemType),
            item.rate?.irate || '',
            item.rate?.wefDate || '',
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ItemMaster.csv';
        link.click();
    };

    const exportToExcel = () => {
        const data = allItems.map(item => ({
            'Item Code': item.itemCode,
            'Item Name': item.itemName,
            'Item Type': getItemTypeLabel(item.itemType),
            'Rate': item.rate?.irate || '',
            'WEF Date': item.rate?.wefDate || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Item Master');
        XLSX.writeFile(wb, 'ItemMaster.xlsx');
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Item Master
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* LEFT CARD - Add / Edit Item */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {itemCode ? 'Edit Item' : 'Add New Item'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth
                                label="Item Code"
                                type="number"
                                value={itemCode}
                                onChange={(e) => setItemCode(e.target.value ? Number(e.target.value) : '')}
                                size="small"
                                disabled={!!selectedItem} // optional: prevent changing code while editing
                            />
                            <TextField
                                fullWidth
                                label="Item Name"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                size="small"
                            />
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={ITEM_TYPES}
                                getOptionLabel={(opt) => opt.label}
                                value={ITEM_TYPES.find(opt => opt.value === itemType) || null}
                                onChange={(_, val) => setItemType(val?.value ?? null)}
                                renderInput={(params) => <TextField {...params} label="Item Type" />}
                            />
                            <TextField
                                fullWidth
                                label="Rate"
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                label="WEF Date"
                                type="date"
                                value={wefDate}
                                onChange={(e) => setWefDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                            />

                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Button variant="contained" onClick={handleSaveNewItem}>
                                    {itemCode ? 'Update Item' : 'Save Item Master'}
                                </Button>
                                {itemCode && (
                                    <Button variant="outlined" color="inherit" onClick={resetLeftForm}>
                                        Cancel Edit
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* RIGHT CARD - Rate Update */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Rate Update</Typography>
                        {selectedItem ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Typography variant="subtitle1">
                                    Item: <strong>{selectedItem.itemName}</strong> (Code: {selectedItem.itemCode})
                                </Typography>
                                <List dense disablePadding>
                                    <ListItem disableGutters>
                                        <ListItemText primary="Previous Rate" secondary={selectedItem.rate?.irate ?? '—'} />
                                    </ListItem>
                                    <Divider />
                                    <ListItem disableGutters>
                                        <ListItemText primary="Previous WEF Date" secondary={selectedItem.rate?.wefDate ?? '—'} />
                                    </ListItem>
                                </List>

                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="New WEF Date"
                                        type="date"
                                        value={newWefDate}
                                        onChange={(e) => setNewWefDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        label="New Rate"
                                        type="number"
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value === '' ? '' : Number(e.target.value))}
                                        size="small"
                                    />
                                </Box>

                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleUpdateRate}
                                    disabled={!newRate || !newWefDate}
                                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                                >
                                    Update Rate
                                </Button>
                            </Box>
                        ) : (
                            <Typography color="text.secondary" sx={{ mt: 4 }}>
                                Select an item using the edit icon (✏️) to update its rate...
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* Table Section */}
            <Box sx={{ mt: 6 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">Item List</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="outlined" onClick={exportToCSV}>Export CSV</Button>
                                <Button variant="outlined" onClick={exportToExcel}>Export Excel</Button>
                            </Box>
                        </Box>

                        <TextField
                            fullWidth
                            label="Search by Code / Name / Type"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Item Code</strong></TableCell>
                                        <TableCell><strong>Item Name</strong></TableCell>
                                        <TableCell><strong>Item Type</strong></TableCell>
                                        <TableCell><strong>Rate</strong></TableCell>
                                        <TableCell><strong>WEF Date</strong></TableCell>
                                        <TableCell align="center"><strong>Action</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.itemCode}>
                                                <TableCell>{item.itemCode}</TableCell>
                                                <TableCell>{item.itemName}</TableCell>
                                                <TableCell>{getItemTypeLabel(item.itemType)}</TableCell>
                                                <TableCell>{item.rate?.irate ?? '—'}</TableCell>
                                                <TableCell>{item.rate?.wefDate ?? '—'}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton color="primary" onClick={() => handleEdit(item.itemCode)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="error" onClick={() => handleDelete(item.itemCode)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No items found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default ItemMaster;
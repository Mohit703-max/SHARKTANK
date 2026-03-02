import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class Ad {
  final String id;
  final String title;
  final String content;

  Ad({
    required this.id,
    required this.title,
    required this.content,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
      };

  factory Ad.fromJson(Map<String, dynamic> j) => Ad(
        id: j['id'] as String,
        title: j['title'] as String,
        content: j['content'] as String,
      );
}

class AdsRepository {
  static const _key = 'zefender_ads';
  final SharedPreferences prefs;

  AdsRepository(this.prefs);

  List<Ad> loadAds() {
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => Ad.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> saveAds(List<Ad> ads) async {
    final raw = jsonEncode(ads.map((a) => a.toJson()).toList());
    await prefs.setString(_key, raw);
  }

  Future<void> addAd(Ad ad) async {
    final ads = loadAds();
    ads.add(ad);
    await saveAds(ads);
  }

  Future<void> removeAd(String id) async {
    final ads = loadAds();
    ads.removeWhere((a) => a.id == id);
    await saveAds(ads);
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zefender Ads Demo',
      theme: ThemeData(primarySwatch: Colors.indigo),
      home: const LaunchScreen(),
    );
  }
}

class LaunchScreen extends StatefulWidget {
  const LaunchScreen({super.key});

  @override
  State<LaunchScreen> createState() => _LaunchScreenState();
}

class _LaunchScreenState extends State<LaunchScreen> {
  final _nameController = TextEditingController();

  // 2. Simulated Database of Admin Users
  final List<String> _approvedAdmins = ['admin', 'zefender']; 

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Zefender Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Enter your display name',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _nameController, 
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'e.g. user123 or admin',
              )
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              onPressed: () async {
                final name = _nameController.text.trim();
                if (name.isEmpty) return;

                final prefs = await SharedPreferences.getInstance();
                final repo = AdsRepository(prefs);

                if (!context.mounted) return;

                // 3. Logic Check: Are they in the Admin Database?
                if (_approvedAdmins.contains(name.toLowerCase())) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => AdminScreen(repo: repo, adminName: name))
                  );
                } else {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => UserScreen(repo: repo, userName: name))
                  );
                }
              },
              child: const Text('Enter App', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminScreen extends StatefulWidget {
  final AdsRepository repo;
  final String adminName;

  const AdminScreen({super.key, required this.repo, required this.adminName});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  List<Ad> _ads = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _ads = widget.repo.loadAds();
    });
  }

  Future<void> _createAd() async {
    final title = _titleCtrl.text.trim();
    final content = _contentCtrl.text.trim();
    if (title.isEmpty || content.isEmpty) return;
    
    // 4. Create an ad that is automatically global
    final ad = Ad(
      id: DateTime.now().millisecondsSinceEpoch.toString(), 
      title: title, 
      content: content,
    );
    
    await widget.repo.addAd(ad);
    _titleCtrl.clear();
    _contentCtrl.clear();
    _load();
  }

  Future<void> _deleteAd(String id) async {
    await widget.repo.removeAd(id);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Admin Dashboard: ${widget.adminName}'),
        backgroundColor: Colors.indigo.shade100,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Ad title')),
            const SizedBox(height: 8),
            TextField(controller: _contentCtrl, decoration: const InputDecoration(labelText: 'Ad content')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _createAd, 
                child: const Text('Publish Ad to All Users')
              )
            ),
            const SizedBox(height: 24),
            const Align(alignment: Alignment.centerLeft, child: Text('Active Ads', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18))),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: _ads.length,
                itemBuilder: (context, i) {
                  final a = _ads[i];
                  return Card(
                    child: ListTile(
                      title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(a.content),
                      trailing: IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteAd(a.id)),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class UserScreen extends StatefulWidget {
  final AdsRepository repo;
  final String userName;

  const UserScreen({super.key, required this.repo, required this.userName});

  @override
  State<UserScreen> createState() => _UserScreenState();
}

class _UserScreenState extends State<UserScreen> {
  List<Ad> _ads = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    // 5. Users just load all ads natively now
    setState(() => _ads = widget.repo.loadAds());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Welcome, ${widget.userName}')),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: _ads.isEmpty
            ? const Center(child: Text('No new ads right now!'))
            : ListView.builder(
                itemCount: _ads.length,
                itemBuilder: (context, i) {
                  final a = _ads[i];
                  return Card(
                    elevation: 3,
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: ListTile(
                      title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(a.content),
                      leading: const Icon(Icons.campaign, color: Colors.indigo),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _load,
        tooltip: 'Check for new ads',
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
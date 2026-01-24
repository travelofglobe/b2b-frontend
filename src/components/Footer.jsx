import React from 'react';

const Footer = () => {
    return (
        <footer className="mt-12 bg-white dark:bg-[#111a22] border-t border-slate-200 dark:border-[#233648] py-10 px-6 lg:px-20">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl text-white">apartment</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold">StayHub</h2>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Curating the world's most luxurious and unique stays for discerning travelers since 2012.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Support</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Safety Information</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Cancellation Options</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Report a concern</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Company</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <li><a className="hover:text-primary transition-colors" href="#">About us</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Press</a></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Newsletter</h4>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Get travel inspiration and exclusive offers.</p>
                    <div className="flex gap-2">
                        <input className="flex-1 bg-slate-100 dark:bg-[#233648] border-none rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary" placeholder="Email address" type="email" />
                        <button className="bg-primary text-white p-2 rounded-lg"><span className="material-symbols-outlined">send</span></button>
                    </div>
                </div>
            </div>
            <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-400">© 2024 StayHub Inc. All rights reserved.</p>
                <div className="flex gap-6">
                    <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                    <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
                    <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">smartphone</span></a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
